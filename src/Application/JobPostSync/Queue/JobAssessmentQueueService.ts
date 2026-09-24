import { IJobPostSyncQueue } from "../../../Infrastructure/Persistence/Queues/JobPostSyncQueue/IJobPostSyncQueue";
import { IJobSourceService } from "../../JobSources/IJobSourceService";
import { IJobPostSyncJob, IJobPostSyncJobRequest } from "./IJobPostSyncJob";
import { IJobPostSyncQueueService } from "./IJobPostSyncQueueService";

export class JobPostSyncQueueService implements IJobPostSyncQueueService {
    constructor(
        private readonly queue: IJobPostSyncQueue,
        private readonly jobSourceService: IJobSourceService
    ) {}
    getJobByIdOrThrow(jobId: string): Promise<IJobPostSyncJob> {
        return this.queue.getJobByIdOrThrow(jobId);
    }
    getActiveJobs(): Promise<IJobPostSyncJob[]> {
        return this.queue.getActiveJobs();
    }

    public async enqueue(job: IJobPostSyncJobRequest): Promise<string> {
        let sourceIds = job.sourceIds ?? [];
        if (sourceIds.length === 0) {
            const sources = await this.jobSourceService.getJobSources();
            sourceIds = sources.map(source => source.id);
        }
        const jobId = await this.queue.enqueue({ ...job, sourceIds });
        return jobId;
    }
}
