import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";

export type JobScreenDisposition = "advance" | "reject" | "review";

export interface IJobScreenResult {
    disposition: JobScreenDisposition;
    reason: string;
    job: IJobPostDiscovery;
}
