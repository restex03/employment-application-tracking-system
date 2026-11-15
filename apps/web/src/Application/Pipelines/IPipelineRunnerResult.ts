import { PipelineStepStatus } from "./IPipelineStepResult";

export interface IPipelineRunnerResult<TContext> {
    status: PipelineStepStatus;
    context: TContext;
    lastStepReached?: string;
    reason?: string;
}
