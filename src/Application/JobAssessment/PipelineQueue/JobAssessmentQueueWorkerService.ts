import { IJobAssessmentQueue } from "../../../Infrastructure/Persistence/JobAssessmentQueue/IJobAssessmentQueue";
import { IJobAssessmentService } from "../IJobAssessmentService";
import { IJobAssessmentQueueWorkerService } from "./IJobAssessmentQueueWorkerService";

export class JobAssessmentQueueWorkerService implements IJobAssessmentQueueWorkerService {
    private running = false;
    constructor(
        private readonly queue: IJobAssessmentQueue,
        private readonly assessmentService: IJobAssessmentService
    ) {}
    public async start(freqMs: number): Promise<void> {
        this.running = true;

        while (this.running) {
            const job = await this.queue.claimNext();

            if (!job) {
                await new Promise(resolve => setTimeout(resolve, freqMs));
                continue;
            }

            try {
                await this.assessmentService.runAssessment(job.jobPostId, job.candidateProfileId);

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
