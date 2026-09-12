import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobAssessmentQueue } from "../../../Infrastructure/Persistence/Queues/JobAssessmentQueue/IJobAssessmentQueue";
import { IJobAssessmentService } from "../IJobAssessmentService";
import { IJobAssessmentQueueWorkerService, IJobQueueWorkerOptions } from "./IJobAssessmentQueueWorkerService";

export class JobAssessmentQueueWorkerService implements IJobAssessmentQueueWorkerService {
    private running = false;
    constructor(
        private readonly queue: IJobAssessmentQueue,
        private readonly assessmentService: IJobAssessmentService,
        private readonly logger: ILogger
    ) {}
    public async start(options: IJobQueueWorkerOptions): Promise<void> {
        this.running = true;

        while (this.running) {
            this.logger.trace(`[JobAssessmentQueueWorkerService] Queue worker running...`);
            const job = await this.queue.claimNext();

            if (!job) {
                await new Promise(resolve => setTimeout(resolve, options.freqMs));
                continue;
            }

            try {
                this.logger.debug(`[JobAssessmentQueueWorkerService.start]: Job started ${job.id}`);
                await this.assessmentService.runAssessment(job.candidateProfileId, job.jobPostId);

                await this.queue.complete(job.id);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.debug(
                    `[JobAssessmentQueueWorkerService.start]: Job failed ${job.id} with error: ${errMsg}`
                );
                await this.queue.fail(job.id, errMsg);
            }
        }
    }

    public stop(): void {
        this.running = false;
    }
}
