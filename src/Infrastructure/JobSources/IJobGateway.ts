import { IWorkdayJobsApiResponse } from "./Workday/Contracts/IWorkdayJobsApiResponse";
import { IWorkdayJobDetailsApiResponse } from "./Workday/Contracts/IWorkdayJobDetailsApiResponse";
import { IJobsLookupRequest } from "../../Domain/JobPosts/IJobsLookupRequest";

export interface IJobGateway {
    search(request: IJobsLookupRequest): Promise<IWorkdayJobsApiResponse>;
    getDetail(url: string): Promise<IWorkdayJobDetailsApiResponse>;
}
