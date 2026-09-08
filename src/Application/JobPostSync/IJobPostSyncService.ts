export interface IJobPostSyncResult {
    sourcesProcessed: number;
    jobsDiscovered: number;
}

export interface IJobPostSyncService {
    sync(sourceIds: string[]): Promise<IJobPostSyncResult>;
}
