export type JobQueueStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface JobAssessmentJobResponse {
    jobId: string;
    status: JobQueueStatus;
}

export interface AssessmentJobResult {
    jobId: string;
    status: JobQueueStatus;
    error?: string;
}
