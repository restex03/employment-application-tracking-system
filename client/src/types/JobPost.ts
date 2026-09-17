export enum JobApplicationStatus {
    Applied = "APPLIED",
    Interview = "INTERVIEW",
    Offer = "OFFER",
    Rejected = "REJECTED",
}
export interface IJobLocation {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

export interface IJobSource {
    id: string;
    companyName: string;
    baseUrl: string;
}

export interface IJobPostDetail {
    id?: string;
    requisitionId?: string;
    title: string;
    description: string;
    validThrough?: string;
    employmentType?: string;
    locations?: IJobLocation[];
    remoteType?: string;
    applicantLocations?: string[];
}

export interface IJobPostData {
    id: string;
    sourceId: string;
    jobMatchScore: number;
    requisitionId?: string;
    title: string;
    remoteType?: string;
    applicationStatus?: JobApplicationStatus;
    detailPath: string;
    locations?: unknown[];
    daysOld?: number;
    createdAt: string;
    detail?: IJobPostDetail;
    jobLink: string;
    dismissed: boolean;
}

export interface IJobPostsResponse {
    data: IJobPostData[];
    totalCount: number;
}

export interface PaginationParams {
    pageNumber: number;
    pageCount: number;
}

export interface QueryFilterParams {
    companyName?: string;
    requisitionId?: string;
    title?: string;
    location?: string;
    daysOld?: string;
    jobMatchScore?: string;
    applicationStatus?: string;
    includeDismissed?: string;
}
