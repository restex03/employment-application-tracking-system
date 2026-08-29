import { IJobSearchResult } from "../../Infrastructure/APIs/JobSources/IJobSearchResult";

export type JobScreenDisposition = "advance" | "reject" | "review";

export interface IJobScreenResult {
    disposition: JobScreenDisposition;
    reason: string;
    job: IJobSearchResult;
}
