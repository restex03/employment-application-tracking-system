import { IJobPostResponse } from "./IJobPostResponse";


export interface JobPostQueryFilters {
    companyName: string;
    requisitionId: string;
    title: string;
    location: string;
    daysOld?: number;
    jobMatchScore?: number;
    applicationStatus?: string;
    includeDismissed?: boolean;
}
export interface IJobPostService {
     list(
            pageCount: number,
            pageNumber: number,
            queryFilters: JobPostQueryFilters
        ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;
    
    getById(id: string): Promise<IJobPostResponse | undefined>;
}
