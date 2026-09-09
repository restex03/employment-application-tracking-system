import { IJobPost } from "../../Domain/JobPosts/IJobPost";

export interface IJobPostService {
    addMany(jobs: IJobPost[]): Promise<void>;
    update(job: IJobPost): Promise<void>;

    getAll(pageCount: number, pageNumber: number): Promise<{ data: IJobPost[]; totalCount: number }>;

    getById(id: string): Promise<IJobPost | undefined>;
    getByIdOrThrow(id: string): Promise<IJobPost>;
}
