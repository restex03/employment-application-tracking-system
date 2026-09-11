export interface IJobQueueWorkerOptions {
    freqMs: number;
}

export interface IJobAssessmentQueueWorkerService {
    start(options: IJobQueueWorkerOptions): Promise<void>;
    stop(): void;
}
