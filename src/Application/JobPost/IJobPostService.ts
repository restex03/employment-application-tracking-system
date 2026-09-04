import { IJobPost } from "../../Domain/JobPosts/IJobPost";

export interface IJobPostService {
    addMany(jobs: IJobPost[]): Promise<void>;

    getAll(): Promise<IJobPost[]>;

    getById(id: string): Promise<IJobPost | undefined>;
}
