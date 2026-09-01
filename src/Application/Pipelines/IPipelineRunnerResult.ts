import { PipelineStepStatus } from "./IPipelineStepResult";

export interface IPipelineRunnerResult<TContext> {
    status: PipelineStepStatus;
    context: TContext;
    failedStep?: string;
    reason?: string;
}
