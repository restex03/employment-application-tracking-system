import { IJobSearchResult } from "./IJobSearchResult";
import { IJobsRequest } from "./IJobsRequest";
import { IJobPostingDetail } from "./IJobPostingDetail";

export interface IJobSource {
    search(request: IJobsRequest): Promise<IJobSearchResult[]>;
    getDetail(url: string): Promise<IJobPostingDetail>;
}
