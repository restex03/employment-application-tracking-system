export interface IWorkdayJobDetailsApiResponse {
    jobPostingInfo: IWorkdayJobPostingInfo;
    hiringOrganization: IWorkdayHiringOrganization;
}

export interface IWorkdayJobPostingInfo {
    id: string;
    title: string;
    jobDescription: string;
    additionalLocations?: string[];

    postedOn: string;
    startDate: string;
    timeType: string;

    jobReqId: string;
    jobPostingId: string;
    jobPostingSiteId: string;

    location?: string;
    country?: IWorkdayCountry;

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
