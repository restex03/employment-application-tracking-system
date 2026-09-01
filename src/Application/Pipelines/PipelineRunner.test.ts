import { describe, expect, it, vi } from "vitest";
import { PipelineRunner } from "./PipelineRunner";
import { IPipelineStep } from "./IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "./IPipelineStepResult";

interface TestContext {
    value: number;
}

class TestPipelineStep implements IPipelineStep<TestContext> {
    public readonly execute = vi.fn<(context: TestContext) => Promise<IPipelineStepResult>>();

    constructor(
        private readonly result: IPipelineStepResult,
        private readonly action?: (context: TestContext) => void
    ) {
        this.execute.mockImplementation(async context => {
            this.action?.(context);
            return this.result;
        });
    }
}

describe("PipelineRunner", () => {
    it("returns succeeded when all steps succeed", async () => {
        const context: TestContext = { value: 0 };

        const step1 = new TestPipelineStep({
            status: PipelineStepStatus.Succeeded,
        });

        const step2 = new TestPipelineStep({
            status: PipelineStepStatus.Succeeded,
        });

        const runner = new PipelineRunner<TestContext>([step1, step2]);

        const result = await runner.run(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
            context,
        });

        expect(step1.execute).toHaveBeenCalledOnce();
        expect(step1.execute).toHaveBeenCalledWith(context);

        expect(step2.execute).toHaveBeenCalledOnce();
        expect(step2.execute).toHaveBeenCalledWith(context);
    });

    it("executes steps in order", async () => {
        const context: TestContext = { value: 0 };
        const executionOrder: number[] = [];

        const step1 = new TestPipelineStep({ status: PipelineStepStatus.Succeeded }, () => executionOrder.push(1));

        const step2 = new TestPipelineStep({ status: PipelineStepStatus.Succeeded }, () => executionOrder.push(2));

        const step3 = new TestPipelineStep({ status: PipelineStepStatus.Succeeded }, () => executionOrder.push(3));

        const runner = new PipelineRunner<TestContext>([step1, step2, step3]);

        await runner.run(context);

        expect(executionOrder).toEqual([1, 2, 3]);
    });

    it("stops executing when a step fails", async () => {
        const context: TestContext = { value: 0 };

        const step1 = new TestPipelineStep({
            status: PipelineStepStatus.Succeeded,
        });

        const failedStep = new TestPipelineStep({
            status: PipelineStepStatus.Failed,
            reason: "Something failed",
        });

        const step3 = new TestPipelineStep({
            status: PipelineStepStatus.Succeeded,
        });

        const runner = new PipelineRunner<TestContext>([step1, failedStep, step3]);

        await runner.run(context);

        expect(step1.execute).toHaveBeenCalledOnce();
        expect(failedStep.execute).toHaveBeenCalledOnce();
        expect(step3.execute).not.toHaveBeenCalled();
    });

    it("returns failure information from the failed step", async () => {
        const context: TestContext = { value: 0 };

        const failedStep = new TestPipelineStep({
            status: PipelineStepStatus.Failed,
            reason: "Unable to process context",
        });

        const runner = new PipelineRunner<TestContext>([failedStep]);

        const result = await runner.run(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            context,
            failedStep: "TestPipelineStep",
            reason: "Unable to process context",
        });
    });

    it("returns the mutated context from completed steps", async () => {
        const context: TestContext = { value: 0 };

        const step1 = new TestPipelineStep({ status: PipelineStepStatus.Succeeded }, ctx => {
            ctx.value += 1;
        });

        const step2 = new TestPipelineStep({ status: PipelineStepStatus.Succeeded }, ctx => {
            ctx.value += 2;
        });

        const runner = new PipelineRunner<TestContext>([step1, step2]);

        const result = await runner.run(context);

        expect(result.context).toBe(context);
        expect(result.context.value).toBe(3);
    });

    it("preserves context changes made before a failure", async () => {
        const context: TestContext = { value: 0 };

        const step1 = new TestPipelineStep({ status: PipelineStepStatus.Succeeded }, ctx => {
            ctx.value = 10;
        });

        const failedStep = new TestPipelineStep(
            {
                status: PipelineStepStatus.Failed,
                reason: "Failed",
            },
            ctx => {
                ctx.value = 20;
            }
        );

        const runner = new PipelineRunner<TestContext>([step1, failedStep]);

        const result = await runner.run(context);

        expect(result.status).toBe(PipelineStepStatus.Failed);
        expect(result.context).toBe(context);
        expect(result.context.value).toBe(20);
    });

    it("returns succeeded when no steps are registered", async () => {
        const context: TestContext = { value: 0 };

        const runner = new PipelineRunner<TestContext>([]);

        const result = await runner.run(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
            context,
        });
    });

    it("allows a failed step to omit a reason", async () => {
        const context: TestContext = { value: 0 };

        const failedStep = new TestPipelineStep({
            status: PipelineStepStatus.Failed,
        });

        const runner = new PipelineRunner<TestContext>([failedStep]);

        const result = await runner.run(context);

        expect(result.status).toBe(PipelineStepStatus.Failed);
        expect(result.failedStep).toBe("TestPipelineStep");
        expect(result.reason).toBeUndefined();
    });
});
