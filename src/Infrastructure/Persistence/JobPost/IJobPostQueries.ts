import { IJobPostResponse } from "../../../Application/JobPost/IJobPostResponse";
import { JobPostQueryFilters } from "../../../Application/JobPost/IJobPostService";

export interface IJobPostQueries {
    getJobPostTableResults(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;
}
