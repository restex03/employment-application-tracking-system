import { IJobAssessmentQueue } from "../../../Infrastructure/Persistence/Queues/JobAssessmentQueue/IJobAssessmentQueue";
import { IJobAssessmentService } from "../IJobAssessmentService";
import { IJobAssessmentQueueWorkerService, IJobQueueWorkerOptions } from "./IJobAssessmentQueueWorkerService";

export class JobAssessmentQueueWorkerService implements IJobAssessmentQueueWorkerService {
    private running = false;
    constructor(
        private readonly queue: IJobAssessmentQueue,
        private readonly assessmentService: IJobAssessmentService
    ) {}
    public async start(options: IJobQueueWorkerOptions): Promise<void> {
        this.running = true;

        while (this.running) {
            const job = await this.queue.claimNext();

            if (!job) {
                await new Promise(resolve => setTimeout(resolve, options.freqMs));
                continue;
            }

            try {
                await this.assessmentService.runAssessment(job.candidateProfileId, job.jobPostId);

                await this.queue.complete(job.id);
            } catch (error) {
                await this.queue.fail(job.id, error instanceof Error ? error.message : String(error));
            }
        }
    }

    public stop(): void {
        this.running = false;
    }
}
