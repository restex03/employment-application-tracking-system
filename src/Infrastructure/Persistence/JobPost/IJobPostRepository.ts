import { IJobPost } from "../../../Domain/JobPosts/IJobPost";

export interface IJobPostRepository {
    add(jobPost: IJobPost): Promise<void>;
    addMany(jobPosts: IJobPost[]): Promise<void>;
}
