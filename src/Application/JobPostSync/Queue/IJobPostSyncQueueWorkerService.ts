export interface IJobQueueWorkerOptions {
    freqMs: number;
}

export interface IJobPostSyncQueueWorkerService {
    start(options: IJobQueueWorkerOptions): Promise<void>;
    stop(): void;
}
