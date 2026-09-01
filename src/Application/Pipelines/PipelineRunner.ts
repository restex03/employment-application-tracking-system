import { IPipelineRunner } from "./IPipelineRunner";
import { IPipelineRunnerResult } from "./IPipelineRunnerResult";
import { IPipelineStep } from "./IPipelineStep";
import { PipelineStepStatus } from "./IPipelineStepResult";

export class PipelineRunner<TContext> implements IPipelineRunner<TContext> {
    constructor(private readonly steps: readonly IPipelineStep<TContext>[]) {}

    public async run(context: TContext): Promise<IPipelineRunnerResult<TContext>> {
        for (const step of this.steps) {
            const result = await step.execute(context);

            if (result.status === PipelineStepStatus.Failed) {
                return {
                    status: PipelineStepStatus.Failed,
                    context,
                    failedStep: step.constructor.name,
                    reason: result.reason,
                };
            }
        }

        return {
            status: PipelineStepStatus.Succeeded,
            context,
        };
    }
}
