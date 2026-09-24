import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobPostSyncDailySchedulerService } from "./IJobPostSyncDailySchedulerService";
import { IJobPostSyncQueueService } from "./IJobPostSyncQueueService";

export class JobPostSyncDailySchedulerService implements IJobPostSyncDailySchedulerService {
    private timeout: ReturnType<typeof setTimeout> | undefined;
    private running = false;

    constructor(
        private readonly jobPostSyncQueueService: IJobPostSyncQueueService,
        private readonly logger: ILogger,
        private readonly hour = 5,
        private readonly minute = 0
    ) {}

    public start(): void {
        if (this.running) {
            return;
        }

        this.running = true;
        this.scheduleNextRun();
    }

    public stop(): void {
        this.running = false;

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }

    private scheduleNextRun(): void {
        if (!this.running) {
            return;
        }

        const now = new Date();
        const nextRun = this.getNextRunDate(now);
        const delayMs = nextRun.getTime() - now.getTime();

        this.logger.info(`[JobPostSyncDailySchedulerService] Next sync scheduled for ${nextRun.toISOString()}`);

        this.timeout = setTimeout(() => {
            void this.enqueueSyncJobAndScheduleNext();
        }, delayMs);
    }

    private async enqueueSyncJobAndScheduleNext(): Promise<void> {
        try {
            const jobId = await this.jobPostSyncQueueService.enqueue({
                sourceIds: [],
                searchText: "software engineer",
            });

            this.logger.info(`[JobPostSyncDailySchedulerService] Enqueued daily job post sync ${jobId}`);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[JobPostSyncDailySchedulerService] Failed to enqueue daily job post sync: ${errMsg}`);
        } finally {
            this.scheduleNextRun();
        }
    }

    private getNextRunDate(now: Date): Date {
        const nextRun = new Date(now);
        nextRun.setHours(this.hour, this.minute, 0, 0);

        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        return nextRun;
    }
}
