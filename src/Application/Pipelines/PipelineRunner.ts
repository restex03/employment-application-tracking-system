import { IPipelineRunner } from "./IPipelineRunner";
import { IPipelineRunnerResult } from "./IPipelineRunnerResult";
import { IPipelineStep } from "./IPipelineStep";
import { PipelineStepStatus } from "./IPipelineStepResult";

export class PipelineRunner<TContext> implements IPipelineRunner<TContext> {
    constructor(private readonly steps: readonly IPipelineStep<TContext>[]) {}

    public async run(context: TContext): Promise<IPipelineRunnerResult<TContext>> {
        let jumpStep: string | undefined;

        for (const step of this.steps) {
            if (jumpStep) {
                if (step.constructor.name !== jumpStep) {
                    continue;
                }

                jumpStep = undefined;
            }

            const result = await step.execute(context);

            if (result.status === PipelineStepStatus.Failed) {
                return {
                    status: result.status,
                    context,
                    lastStepReached: step.constructor.name,
                    reason: result.reason,
                };
            }

            if (result.status === PipelineStepStatus.Jumped) {
                if (!result.jumpStep) {
                    throw new Error(`Pipeline step ${step.constructor.name} returned Jumped without a jumpStep.`);
                }

                jumpStep = result.jumpStep;
            }
        }

        if (jumpStep) {
            throw new Error(`Pipeline jump target '${jumpStep}' was not found.`);
        }

        return {
            status: PipelineStepStatus.Succeeded,
            context,
        };
    }
}
