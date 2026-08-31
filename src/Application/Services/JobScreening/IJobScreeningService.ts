import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobScreenResult } from "../../../Evaluators/JobScreenEvaluator/IJobScreenResult";

export interface IJobScreeningService {
    screen(jobs: IJobPostLookup[]): Promise<IJobScreenResult[]>;
}
