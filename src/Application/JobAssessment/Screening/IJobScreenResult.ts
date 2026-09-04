import { IJobPost } from "../../../Domain/JobPosts/IJobPost";

export type JobScreenDisposition = "advance" | "reject" | "review";

export interface IJobScreenResult {
    disposition: JobScreenDisposition;
    reason: string;
    job: IJobPost;
}
