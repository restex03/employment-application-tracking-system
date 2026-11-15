import { IJobPostService } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostSyncWorkerOptions, IJobPostSyncWorkerService } from "./IJobPostSyncWorkerService";

const initialSyncDate = new Date(0).toISOString();

export class JobPostSyncWorkerService implements IJobPostSyncWorkerService {
    private running = false;
    private waitTimer?: ReturnType<typeof setTimeout>;
    private resolveWait?: () => void;

    constructor(
        private readonly jobPostService: IJobPostService,
        private readonly jobPostRepository: IJobPostRepository,
        private readonly logger: ILogger
    ) {}

    public async start(options: IJobPostSyncWorkerOptions): Promise<void> {
        this.running = true;

        while (this.running) {
            try {
                const latestJob = await this.jobPostRepository.getLatestJob();
                const fromDate = latestJob?.importedDate.toISOString() ?? initialSyncDate;
                await this.jobPostService.importJobPosts(fromDate);
                this.logger.info(`Job post sync completed from ${fromDate}.`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Job post sync failed: ${errorMessage}`);
            }

            if (this.running) {
                await this.wait(options.freqMs);
            }
        }
    }

    public stop(): void {
        this.running = false;
        if (this.waitTimer) {
            clearTimeout(this.waitTimer);
            this.waitTimer = undefined;
        }
        this.resolveWait?.();
        this.resolveWait = undefined;
    }

    private wait(freqMs: number): Promise<void> {
        return new Promise(resolve => {
            this.resolveWait = resolve;
            this.waitTimer = setTimeout(() => {
                this.waitTimer = undefined;
                this.resolveWait = undefined;
                resolve();
            }, freqMs);
        });
    }
}
