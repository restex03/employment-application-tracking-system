import { IJobAssessment } from "../../Domain/JobAssessment/IJobAssessment";
import { IJobAssessmentResult } from "./IJobAssessmentResult";

export interface IJobAssessmentService {
    runAssessment(candidateProfileId: string, jobPostId: string): Promise<IJobAssessmentResult>;
    getAssessmentByIdOrThrow(id: string): Promise<IJobAssessment>;
    getAssessment(jobPostId: string, candidateProfileId: string): Promise<IJobAssessment | undefined>;
}
