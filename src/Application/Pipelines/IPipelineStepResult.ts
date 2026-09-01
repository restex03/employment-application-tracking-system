export enum PipelineStepStatus {
    Succeeded = "succeeded",
    Failed = "failed",
}

export interface IPipelineStepResult {
    status: PipelineStepStatus;
    reason?: string;
}
