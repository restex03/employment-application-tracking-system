import { IJobPostSyncJob, IJobPostSyncJobRequest } from "./IJobPostSyncJob";

export interface IJobPostSyncQueueService {
    getActiveJobs(): Promise<IJobPostSyncJob[]>;
    enqueue(job: IJobPostSyncJobRequest): Promise<string>;
    getJobByIdOrThrow(jobId: string): Promise<IJobPostSyncJob>;
}
