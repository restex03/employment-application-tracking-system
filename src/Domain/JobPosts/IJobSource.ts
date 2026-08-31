import { IWorkdayJobsApiResponse } from "../../Infrastructure/JobSources/Workday/Contracts/IWorkdayJobsApiResponse";
import { IWorkdayJobDetailsApiResponse } from "../../Infrastructure/JobSources/Workday/Contracts/IWorkdayJobDetailsApiResponse";
import { IJobsLookupRequest } from "./IJobsLookupRequest";

export interface IJobGateway {
    search(request: IJobsLookupRequest): Promise<IWorkdayJobsApiResponse>;
    getDetail(url: string): Promise<IWorkdayJobDetailsApiResponse>;
}
