import { IJobPost } from "../../../Domain/JobPosts/IJobPost";

export interface IJobRepository {
    add(jobPost: IJobPost): Promise<void>;
    addMany(jobPosts: IJobPost[]): Promise<void>;
}
