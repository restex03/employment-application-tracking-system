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

export interface IJobLocation {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}
