import { IJobAssessmentResult } from "../../../Application/JobAssessment/IJobAssessmentResult";
import { IJobAssessment, JobAssessmentReviewStatus } from "../../../Domain/JobAssessment/IJobAssessment";

export interface IJobAssessmentRepository {
    storeAssessment(result: IJobAssessment): Promise<IJobAssessment>;
    getById(id: string): Promise<IJobAssessment | undefined>;
    getByIdOrThrow(id: string): Promise<IJobAssessment>;
    getLatestAssessment(jobPostId: string, candidateProfileId: string): Promise<IJobAssessment | undefined>;
    getLatestAssessmentOrThrow(jobPostId: string, candidateProfileId: string): Promise<IJobAssessment>;
    updateReviewStatus(id: string, reviewStatus: JobAssessmentReviewStatus): Promise<void>;
}
