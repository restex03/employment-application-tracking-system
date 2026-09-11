export interface IJobAssessmentQueueWorkerService {
    start(freqMs: number): Promise<void>;
    stop(): void;
}
