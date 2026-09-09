import { IJobAssessmentResult } from "../../../Application/JobAssessment/IJobAssessmentResult";
import { IJobAssessment } from "../../../Domain/JobAssessment/IJobAssessment";

export interface IJobAssessmentRepository {
    storeAssessment(result: IJobAssessment): Promise<IJobAssessment>;
    getById(id: string): Promise<IJobAssessment | undefined>;
    getByIdOrThrow(id: string): Promise<IJobAssessment>;
    getByJobPostAndCandidateId(jobPostId: string, candidateProfileId: string): Promise<IJobAssessment | undefined>;
    getByJobPostAndCandidateIdOrThrow(jobPostId: string, candidateProfileId: string): Promise<IJobAssessment>;
}
