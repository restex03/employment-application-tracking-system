import { IJobSearchResult } from "../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreenEvaluator {
    screenJob(job: IJobSearchResult): Promise<IJobScreenResult>;
}
