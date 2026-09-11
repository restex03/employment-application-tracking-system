export enum PipelineStepStatus {
    Succeeded = "succeeded",
    Failed = "failed",
    Jumped = "jumped",
}

export interface IPipelineStepResult {
    status: PipelineStepStatus;
    jumpStep?: string;
    reason?: string;
}
