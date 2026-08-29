import { IJobSearchResult } from "../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobScreeningResult } from "./IJobScreeningResult";

export interface IJobScreener {
    screen(jobs: IJobSearchResult[]): Promise<IJobScreeningResult[]>;
}
