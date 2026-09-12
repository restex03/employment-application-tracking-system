import { JobQueueStatus } from "../../../Infrastructure/Persistence/Queues/JobQueueStatus";
import { IJobAssessmentJob, IJobAssessmentJobRequest } from "./IJobAssessmentJob";

export interface IJobAssessmentQueueService {
    getActiveJobs(): Promise<IJobAssessmentJob[]>;
    enqueue(job: IJobAssessmentJobRequest): Promise<string>;
    // TODO: Update to return IJobAssessmentJob instead of JobQueueStatus */
    getStatus(jobId: string): Promise<JobQueueStatus | null>;
}
