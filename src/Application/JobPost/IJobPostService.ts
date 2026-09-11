import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostResponse } from "./IJobPostResponse";

export interface JobPostQueryFilters {
    companyName: string;
    requisitionId: string;
    title: string;
    location: string;
    daysOld: string;
    jobMatchScore: number;
}

export interface IJobPostService {
    addMany(jobs: IJobPost[]): Promise<void>;
    update(job: IJobPost): Promise<void>;

    getAll(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;

    getById(id: string): Promise<IJobPost | undefined>;
    getByIdOrThrow(id: string): Promise<IJobPost>;
}
