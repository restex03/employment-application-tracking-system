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
    datePosted?: string;
    validThrough?: string;
    employmentType?: string;
    locations?: IJobLocation[];
    remoteType?: string;
    applicantLocations?: string[];
}

export interface IJobPost {
    id: string;
    sourceId: string;
    requisitionId?: string;
    title: string;
    detailPath: string;
    locations?: unknown[];
    postedDate?: string;
    createdAt: string;
    detail?: IJobPostDetail;
}

export interface IJobPostsResponse {
    data: IJobPost[];
    totalCount: number;
}

export interface PaginationParams {
    pageNumber: number;
    pageCount: number;
}
