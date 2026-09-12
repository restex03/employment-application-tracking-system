import { JobQueueStatus } from "./JobAssessmentJob";

/** Matches the backend's IJobPostSyncJob, as returned by GET /api/v1/sync-jobs. */
export interface IJobPostSyncJob {
    id: string;
    sourceIds: string[];
    searchText?: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
