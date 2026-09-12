import { IJobPostSyncQueue } from "../../../Infrastructure/Persistence/Queues/JobPostSyncQueue/IJobPostSyncQueue";
import { IJobPostSyncJob, IJobPostSyncJobRequest } from "./IJobPostSyncJob";
import { IJobPostSyncQueueService } from "./IJobPostSyncQueueService";

export class JobPostSyncQueueService implements IJobPostSyncQueueService {
    constructor(private readonly queue: IJobPostSyncQueue) {}
    getJobByIdOrThrow(jobId: string): Promise<IJobPostSyncJob> {
        return this.queue.getJobByIdOrThrow(jobId);
    }
    getActiveJobs(): Promise<IJobPostSyncJob[]> {
        return this.queue.getActiveJobs();
    }

    public async enqueue(job: IJobPostSyncJobRequest): Promise<string> {
        const jobId = await this.queue.enqueue(job);
        return jobId;
    }
}
