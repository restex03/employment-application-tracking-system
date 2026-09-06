import { IJobAssessmentResult } from "../../../Application/JobAssessment/IJobAssessmentResult";
import { IJobAssessment } from "../../../Domain/JobAssessment/IJobAssessment";

export interface IJobAssessmentRepository {
    storeAssessment(result: IJobAssessment): Promise<IJobAssessment>;
    getByIdOrThrow(id: string): Promise<IJobAssessment>;
    getById(id: string): Promise<IJobAssessment | undefined>;
}
