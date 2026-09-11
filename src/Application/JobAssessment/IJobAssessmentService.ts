import { IJobAssessmentResponse } from "../../Api/Contracts/JobAssessment/IJobAssessmentResponse";
import { IJobAssessmentResult } from "./IJobAssessmentResult";

export interface IJobAssessmentService {
    runAssessment(candidateProfileId: string, jobPostId: string): Promise<IJobAssessmentResult>;
    getAssessmentByIdOrThrow(id: string): Promise<IJobAssessmentResponse>;
    getAssessmentOrThrow(jobPostId: string, candidateProfileId: string): Promise<IJobAssessmentResponse>;
}
