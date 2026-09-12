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

/** Matches the backend's IJobAssessmentJob, as returned by GET /api/v1/assessment-jobs. */
export interface IAssessmentJob {
    id: string;
    jobPostId: string;
    candidateProfileId: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
