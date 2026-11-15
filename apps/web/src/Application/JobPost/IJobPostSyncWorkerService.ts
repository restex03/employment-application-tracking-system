export interface IJobPostSyncWorkerOptions {
    freqMs: number;
}

export interface IJobPostSyncWorkerService {
    start(options: IJobPostSyncWorkerOptions): Promise<void>;
    stop(): void;
}
