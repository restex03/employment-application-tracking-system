import { IJobPostSyncQueue } from "../../../Infrastructure/Persistence/Queues/JobPostSyncQueue/IJobPostSyncQueue";
import { IJobPostSyncService } from "../IJobPostSyncService";
import { IJobPostSyncQueueWorkerService, IJobQueueWorkerOptions } from "./IJobPostSyncQueueWorkerService";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";

export class JobPostSyncQueueWorkerService implements IJobPostSyncQueueWorkerService {
    private running = false;
    constructor(
        private readonly queue: IJobPostSyncQueue,
        private readonly jobPostSyncService: IJobPostSyncService,
        private readonly logger: ILogger
    ) {}
    public async start(options: IJobQueueWorkerOptions): Promise<void> {
        this.running = true;

        while (this.running) {
            this.logger.trace(`[JobPostSyncQueueWorkerService] Queue worker running...`);
            const job = await this.queue.claimNext();

            if (!job) {
                await new Promise(resolve => setTimeout(resolve, options.freqMs));
                continue;
            }

            try {
                this.logger.debug(`[JobPostSyncQueueWorkerService.start]: Job started ${job.id}`);
                await this.jobPostSyncService.syncJobs(job.sourceIds, job.searchText);

                await this.queue.complete(job.id);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.debug(`[JobPostSyncQueueWorkerService.start]: Job failed ${job.id} with error: ${errMsg}`);
                await this.queue.fail(job.id, errMsg);
            }
        }
    }

    public stop(): void {
        this.running = false;
    }
}
