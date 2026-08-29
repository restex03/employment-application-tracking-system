import { IJobsRequest } from "./IJobsRequest";
import { IJobPostingDetail } from "./IJobPostingDetail";
import { IWorkdayJobsResponse } from "../ACL/ApiContracts/IWorkdayJobsResponse";

export interface IJobGateway {
    search(request: IJobsRequest): Promise<IWorkdayJobsResponse>;
    getDetail(url: string): Promise<IJobPostingDetail>;
}
