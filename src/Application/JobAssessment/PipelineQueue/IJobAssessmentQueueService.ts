import { JobQueueStatus } from "../../../Infrastructure/Persistence/Queues/JobQueueStatus";
import { IJobAssessmentJob, IJobAssessmentJobRequest } from "./IJobAssessmentJob";

export interface IJobAssessmentQueueService {
    getActiveJobs(): Promise<IJobAssessmentJob[]>;
    enqueue(job: IJobAssessmentJobRequest): Promise<string>;
    getJobByIdOrThrow(jobId: string): Promise<IJobAssessmentJob>;
}
