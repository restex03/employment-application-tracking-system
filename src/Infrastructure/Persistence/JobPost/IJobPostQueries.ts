import { IJobPostResponse } from "../../../Application/JobPost/IJobPostResponse";
import { JobPostQueryFilters } from "../../../Application/JobPost/IJobPostResultTableService";

export interface IJobPostQueries {
    getJobPostTableResults(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;
    getJobPostTableResultById(id: string): Promise<IJobPostResponse | undefined>;
    getJobPostTableResultByIdOrThrow(id: string): Promise<IJobPostResponse>;
}
