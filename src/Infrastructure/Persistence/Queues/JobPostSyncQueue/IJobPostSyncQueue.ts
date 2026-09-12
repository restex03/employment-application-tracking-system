import { IJobPostSyncJob, IJobPostSyncJobRequest } from "../../../../Application/JobPostSync/Queue/IJobPostSyncJob";
import { JobQueueStatus } from "../JobQueueStatus";

export interface IJobPostSyncQueue {
    getActiveJobs(): Promise<IJobPostSyncJob[]>;
    getJobByIdOrThrow(jobId: string): Promise<IJobPostSyncJob>;
    enqueue(job: IJobPostSyncJobRequest): Promise<string>;

    claimNext(): Promise<IJobPostSyncJob | null>;

    complete(jobId: string): Promise<void>;

    fail(jobId: string, error: string): Promise<void>;
}
