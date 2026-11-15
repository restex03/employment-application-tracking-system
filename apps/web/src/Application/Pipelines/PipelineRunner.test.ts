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

class JumpingPipelineStep extends TestPipelineStep {}
class SkippedPipelineStep extends TestPipelineStep {}
class TargetPipelineStep extends TestPipelineStep {}

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
            lastStepReached: "TestPipelineStep",
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
        expect(result.lastStepReached).toBe("TestPipelineStep");
        expect(result.reason).toBeUndefined();
    });

    it("jumps to the named step and skips intervening steps", async () => {
        const context: TestContext = { value: 0 };
        const executionOrder: string[] = [];

        const jumpingStep = new JumpingPipelineStep(
            {
                status: PipelineStepStatus.Jumped,
                jumpStep: TargetPipelineStep.name,
            },
            () => executionOrder.push("jump")
        );
        const skippedStep = new SkippedPipelineStep({ status: PipelineStepStatus.Succeeded }, () =>
            executionOrder.push("skipped")
        );
        const targetStep = new TargetPipelineStep({ status: PipelineStepStatus.Succeeded }, () =>
            executionOrder.push("target")
        );

        const runner = new PipelineRunner<TestContext>([jumpingStep, skippedStep, targetStep]);

        const result = await runner.run(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
            context,
        });
        expect(executionOrder).toEqual(["jump", "target"]);
    });

    it("throws when a jumped step does not provide a jump target", async () => {
        const context: TestContext = { value: 0 };
        const jumpingStep = new JumpingPipelineStep({ status: PipelineStepStatus.Jumped });
        const runner = new PipelineRunner<TestContext>([jumpingStep]);

        await expect(runner.run(context)).rejects.toThrow(
            "Pipeline step JumpingPipelineStep returned Jumped without a jumpStep."
        );
    });

    it("throws when a jump target is not found", async () => {
        const context: TestContext = { value: 0 };
        const jumpingStep = new JumpingPipelineStep({
            status: PipelineStepStatus.Jumped,
            jumpStep: "MissingPipelineStep",
        });
        const runner = new PipelineRunner<TestContext>([jumpingStep]);

        await expect(runner.run(context)).rejects.toThrow("Pipeline jump target 'MissingPipelineStep' was not found.");
    });
});
