import { IJobSearchResult } from "../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreenEvaluator {
    evaluate(job: IJobSearchResult): Promise<IJobScreenResult>;
}
