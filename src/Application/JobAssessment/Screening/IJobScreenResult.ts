import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";

export type JobScreenDisposition = "advance" | "reject" | "review";

export interface IJobScreenResult {
    disposition: JobScreenDisposition;
    reason: string;
    job: IJobPostLookup;
}
