export interface IWorkdayJobDetailResponse {
    jobPostingInfo: IWorkdayJobPostingInfo;
    hiringOrganization: IWorkdayHiringOrganization;
}

export interface IWorkdayJobPostingInfo {
    id: string;
    title: string;
    jobDescription: string;

    location: string;
    additionalLocations?: string[];

    postedOn: string;
    startDate: string;
    timeType: string;

    jobReqId: string;
    jobPostingId: string;
    jobPostingSiteId: string;

    country: IWorkdayCountry;

    externalUrl: string;
}

export interface IWorkdayCountry {
    descriptor: string;
    id: string;
}

export interface IWorkdayHiringOrganization {
    name: string;
    url: string;
}
