import { JobQueueStatus } from "./JobAssessmentJob";

/** Matches the backend's IJobPostSyncJob, as returned by GET /api/v1/queue-jobs/job-post-syncs. */
export interface IJobPostSyncJob {
    id: string;
    sourceIds: string[];
    searchText?: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
