import { IJobScreenResult } from "../../../Evaluators/JobScreenEvaluator/IJobScreenResult";
import { IJobSearchResult } from "../../../Infrastructure/APIs/JobSources/IJobSearchResult";

export interface IJobScreeningService {
    screen(jobs: IJobSearchResult[]): Promise<IJobScreenResult[]>;
}
