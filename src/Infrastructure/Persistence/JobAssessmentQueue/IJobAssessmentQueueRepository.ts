export interface IJobAssessmentQueueRepository {
    claimNextQueuedJob(): Promise<any>;
}
