import { JobQueueStatus } from "../../../Infrastructure/Persistence/Queues/JobQueueStatus";

export interface IJobPostSyncJobRequest {
    sourceIds: string[];
    searchText?: string;
}

export interface IJobPostSyncJob extends IJobPostSyncJobRequest {
    id: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
