import { IJobSearchResult } from "../../APIs/JobSources/IJobSearchResult";

export type JobScreeningDisposition = "advance" | "reject" | "review";

export interface IJobScreeningResult {
    disposition: JobScreeningDisposition;
    reason: string;
    job: IJobSearchResult;
}
