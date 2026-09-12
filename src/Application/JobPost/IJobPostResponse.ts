export interface IJobLocationResponse {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

export interface IJobPostDetailResponse {
    id?: string;
    requisitionId?: string;
    description: string;

    datePosted?: string;
    validThrough?: string;

    employmentType?: string;

    locations?: IJobLocationResponse[];

    remoteType?: string;

    applicantLocations?: string[];
}

export interface IJobPostResponse {
    id: string;
    sourceId: string;
    requisitionId?: string;
    title: string;
    detailPath: string;
    jobLink: string;
    locations?: unknown[];
    daysOld?: string;
    createdAt: Date;
    detail?: IJobPostDetailResponse;
    applicationStatus?: string;
    requirementMatchScore?: number;
}
