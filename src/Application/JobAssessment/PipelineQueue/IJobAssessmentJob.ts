export enum JobQueueStatus {
    Queued = "QUEUED",
    InProgress = "IN_PROGRESS",
    Completed = "COMPLETED",
    Failed = "FAILED",
}

export interface IJobAssessmentJobRequest {
    jobPostId: string;
    candidateProfileId: string;
}

export interface IJobAssessmentJob extends IJobAssessmentJobRequest {
    id: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
