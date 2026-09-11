import { IJobAssessmentJobRequest, JobQueueStatus } from "./IJobAssessmentJob";

export interface IJobAssessmentQueueService {
    enqueue(job: IJobAssessmentJobRequest): Promise<string>;
    getStatus(jobId: string): Promise<JobQueueStatus | null>;
}
