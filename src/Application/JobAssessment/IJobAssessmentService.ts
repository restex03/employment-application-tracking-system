import { IJobAssessment } from "../../Domain/JobAssessment/IJobAssessment";
import { IJobAssessmentResult } from "./IJobAssessmentResult";

export interface IJobAssessmentService {
    runAssessment(candidateProfileId: string, jobPostId: string): Promise<IJobAssessmentResult>;
    getAssessment(id: string): Promise<IJobAssessment>;
}
