import { IJobPostSyncQueue } from "../../../Infrastructure/Persistence/Queues/JobPostSyncQueue/IJobPostSyncQueue";
import { IJobPostSyncJob, IJobPostSyncJobRequest } from "./IJobPostSyncJob";
import { IJobPostSyncQueueService } from "./IJobPostSyncQueueService";

export class JobPostSyncQueueService implements IJobPostSyncQueueService {
    constructor(private readonly queue: IJobPostSyncQueue) {}
    getJobById(jobId: string): Promise<IJobPostSyncJob | null> {
        return this.queue.getJobById(jobId);
    }
    getActiveJobs(): Promise<IJobPostSyncJob[]> {
        return this.queue.getActiveJobs();
    }

    public async enqueue(job: IJobPostSyncJobRequest): Promise<string> {
        const jobId = await this.queue.enqueue(job);
        return jobId;
    }
}
