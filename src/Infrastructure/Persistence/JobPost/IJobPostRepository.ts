import { JobPostQueryFilters } from "../../../Application/JobPost/IJobPostService";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";

export interface IJobPostRepository {
    add(jobPost: IJobPost): Promise<void>;
    addMany(jobPosts: IJobPost[]): Promise<void>;
    update(jobPost: IJobPost): Promise<void>;
    getAll(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPost[]; totalCount: number }>;
    getById(id: string): Promise<IJobPost | undefined>;
    getByIdOrThrow(id: string): Promise<IJobPost>;
}
