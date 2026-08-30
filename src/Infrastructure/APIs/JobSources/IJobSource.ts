import { IJobsRequest } from "./IJobsRequest";
import { IJobPostingDetail } from "./IJobPostingDetail";
import { IWorkdayJobsResponse } from "../ACL/ApiContracts/IWorkdayJobsResponse";
import { IWorkdayJobDetailsApiResponse } from "../ACL/ApiContracts/IWorkdayJobDetailResponse";

export interface IJobGateway {
    search(request: IJobsRequest): Promise<IWorkdayJobsResponse>;
    getDetail(url: string): Promise<IWorkdayJobDetailsApiResponse>;
}
