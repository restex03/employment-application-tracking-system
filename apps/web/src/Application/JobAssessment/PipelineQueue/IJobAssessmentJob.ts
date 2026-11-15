import { JobQueueStatus } from "../../../Infrastructure/Persistence/Queues/JobQueueStatus";

export interface IJobAssessmentJobRequest {
    jobPostId: string;
    candidateProfileId: string;
}

export interface IJobAssessmentJob extends IJobAssessmentJobRequest {
    id: string;
    status: JobQueueStatus;
    error?: string;
    warnings?: string[];
}
