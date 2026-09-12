import {
    IJobAssessmentJob,
    IJobAssessmentJobRequest,
} from "../../../../Application/JobAssessment/PipelineQueue/IJobAssessmentJob";
import { JobQueueStatus } from "../JobQueueStatus";

export interface IJobAssessmentQueue {
    getActiveJobs(): Promise<IJobAssessmentJob[]>;
    enqueue(job: IJobAssessmentJobRequest): Promise<string>;
    getStatus(jobId: string): Promise<JobQueueStatus | null>;

    claimNext(): Promise<IJobAssessmentJob | null>;

    complete(jobId: string): Promise<void>;

    fail(jobId: string, error: string): Promise<void>;
}
