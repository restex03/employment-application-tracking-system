import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { JobPostQueryFilters } from "../../JobPosts/IJobPostGateway";

export interface IJobPostRepository {
    getById(id: string): Promise<IJobPost | undefined>;

    getLatestJob(): Promise<IJobPost | undefined>;

    list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPost[]; totalCount: number }>;

    upsert(jobPost: IJobPost): Promise<void>;

    upsertMany(jobPosts: IJobPost[]): Promise<void>;
}
