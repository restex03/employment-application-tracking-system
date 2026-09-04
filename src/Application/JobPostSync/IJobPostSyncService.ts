export interface IJobPostSyncResult {
    sourcesProcessed: number;
    jobsDiscovered: number;
}

export interface IJobPostSyncService {
    sync(sourceId?: string): Promise<IJobPostSyncResult>;
}
