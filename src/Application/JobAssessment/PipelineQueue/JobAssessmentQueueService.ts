import { IJobAssessmentQueue } from "../../../Infrastructure/Persistence/JobAssessmentQueue/IJobAssessmentQueue";
import { IJobAssessmentService } from "../IJobAssessmentService";
import { IJobAssessmentJob, IJobAssessmentJobRequest, JobQueueStatus } from "./IJobAssessmentJob";
import { IJobAssessmentQueueService } from "./IJobAssessmentQueueService";

export class JobAssessmentQueueService implements IJobAssessmentQueueService {
    private running = false;

    constructor(private readonly queue: IJobAssessmentQueue) {}
    getActiveJobs(): Promise<IJobAssessmentJob[]> {
        return this.queue.getActiveJobs();
    }

    public async getStatus(jobId: string): Promise<JobQueueStatus | null> {
        return this.queue.getStatus(jobId);
    }
    public async enqueue(job: IJobAssessmentJobRequest): Promise<string> {
        const jobId = await this.queue.enqueue(job);
        return jobId;
    }
}
