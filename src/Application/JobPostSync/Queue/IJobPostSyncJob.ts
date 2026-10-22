
export interface IJobPostSyncTaskRequest {
    sourceIds: string[];
    searchText?: string;
}

export interface IJobPostSyncTask extends IJobPostSyncTaskRequest {
    id: string;
    status: string;
    error?: string;
}
