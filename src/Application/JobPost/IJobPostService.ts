import { IJobPostResponse } from "./IJobPostResponse";


export interface JobPostQueryFilters {
    companyName: string;
    requisitionId: string;
    title: string;
    location: string;
    /** Inclusive lower bound: return jobs posted on or after this timestamp. */
    postedDate?: string;
    jobMatchScore?: number;
    applicationStatus?: string;
}
export interface IJobPostService {
     list(
            pageCount: number,
            pageNumber: number,
            queryFilters: JobPostQueryFilters
        ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;
    
    getById(id: string): Promise<IJobPostResponse | undefined>;
}
