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

export interface IJobPostResultService {
    getAll(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;

    getByIdOrThrow(id: string): Promise<IJobPostResponse>;
}
