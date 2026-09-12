import { IJobAssessmentQueue } from "../../../Infrastructure/Persistence/Queues/JobAssessmentQueue/IJobAssessmentQueue";
import { JobQueueStatus } from "../../../Infrastructure/Persistence/Queues/JobQueueStatus";
import { IJobAssessmentJob, IJobAssessmentJobRequest } from "./IJobAssessmentJob";
import { IJobAssessmentQueueService } from "./IJobAssessmentQueueService";

export class JobAssessmentQueueService implements IJobAssessmentQueueService {
    private running = false;

    constructor(private readonly queue: IJobAssessmentQueue) {}
    getActiveJobs(): Promise<IJobAssessmentJob[]> {
        return this.queue.getActiveJobs();
    }

    public async getJobByIdOrThrow(jobId: string): Promise<IJobAssessmentJob> {
        return this.queue.getJobByIdOrThrow(jobId);
    }
    public async enqueue(job: IJobAssessmentJobRequest): Promise<string> {
        const jobId = await this.queue.enqueue(job);
        return jobId;
    }
}
