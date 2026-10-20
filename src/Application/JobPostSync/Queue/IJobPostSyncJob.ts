import { JobQueueStatus } from "../../../Infrastructure/Persistence/Queues/JobQueueStatus";

export interface IJobPostSyncTaskRequest {
    sourceIds: string[];
    searchText?: string;
}

export interface IJobPostSyncTask extends IJobPostSyncTaskRequest {
    id: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
