export interface IJobPostSyncResult {
    sourcesProcessed: number;
    jobsDiscovered: number;
}

export interface IJobPostSyncService {
    syncJobDetails(jobPostId: string): Promise<void>;
    syncJobs(sourceIds: string[]): Promise<IJobPostSyncResult>;
}
