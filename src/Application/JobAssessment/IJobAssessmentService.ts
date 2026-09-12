import { IJobAssessmentResponse } from "../../Api/Contracts/JobAssessment/IJobAssessmentResponse";
import { IJobAssessmentResult } from "./IJobAssessmentResult";

export interface IJobAssessmentService {
    runAssessment(candidateProfileId: string, jobPostId: string): Promise<IJobAssessmentResult>;
    getAssessmentByIdOrThrow(id: string): Promise<IJobAssessmentResponse>;
    getLatestAssessmentOrThrow(jobPostId: string, candidateProfileId: string): Promise<IJobAssessmentResponse>;
}
