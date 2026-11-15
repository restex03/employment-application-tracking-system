import { IJobPostResponse } from "../../../Application/JobPost/IJobPostResponse";
import { JobPostQueryFilters } from "../../../Application/JobPost/IJobPostService";

export interface IAssessmentHydration {
    jobPostId: string;
    requirementMatchScore: number;
}

export interface IApplicationHydration {
    jobPostId: string;
    applicationStatus: string | null;
}

export interface IJobPostQueries {
    getJobPostsForClient(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }>;
    getJobApplications(jobPostIds: string[], applicationStatus: string | undefined): Promise<IApplicationHydration[]>;
    getJobAssessments(jobPostIds: string[], jobMatchScore: number | undefined): Promise<IAssessmentHydration[]>;
}
