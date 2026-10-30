import { IJobPostResponse } from "./IJobPostResponse";

export const jobPostSortFields = ["companyName", "requisitionId", "title", "location", "postedDate"] as const;
export type JobPostSortBy = typeof jobPostSortFields[number];
export type JobPostSortDirection = "asc" | "desc";

export interface JobPostQueryFilters {
    companyName: string;
    requisitionId: string;
    title: string;
    location: string;
    /** Inclusive lower bound: return jobs posted on or after this timestamp. */
    postedDate?: string;
    jobMatchScore?: number;
    applicationStatus?: string;
    sortBy?: JobPostSortBy;
    sortDirection?: JobPostSortDirection;
}
export interface IJobPostService {
     list(
            pageCount: number,
            pageNumber: number,
            queryFilters: JobPostQueryFilters
        ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;
    
    getById(id: string): Promise<IJobPostResponse | undefined>;
}
