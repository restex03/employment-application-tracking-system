import {
    IJobAssessmentJob,
    IJobAssessmentJobRequest,
    JobQueueStatus,
} from "../../../Application/JobAssessment/PipelineQueue/IJobAssessmentJob";

export interface IJobAssessmentQueue {
    enqueue(job: IJobAssessmentJobRequest): Promise<string>;
    getStatus(jobId: string): Promise<JobQueueStatus | null>;

    claimNext(): Promise<IJobAssessmentJob | null>;

    complete(jobId: string): Promise<void>;

    fail(jobId: string, error: string): Promise<void>;
}
