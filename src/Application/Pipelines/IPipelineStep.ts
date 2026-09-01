import { IPipelineStepResult } from "./IPipelineStepResult";

export interface IPipelineStep<TContext> {
    execute(context: TContext): Promise<IPipelineStepResult>;
}
