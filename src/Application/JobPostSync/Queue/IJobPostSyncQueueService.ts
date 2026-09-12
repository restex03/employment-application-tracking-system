import { IJobPostSyncJob, IJobPostSyncJobRequest } from "./IJobPostSyncJob";

export interface IJobPostSyncQueueService {
    getActiveJobs(): Promise<IJobPostSyncJob[]>;
    enqueue(job: IJobPostSyncJobRequest): Promise<string>;
    getJobById(jobId: string): Promise<IJobPostSyncJob | null>;
}
