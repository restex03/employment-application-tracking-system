export enum PipelineStepStatus {
    Succeeded = "succeeded",
    Failed = "failed",
    Stopped = "stopped",
}

export interface IPipelineStepResult {
    status: PipelineStepStatus;
    reason?: string;
}
