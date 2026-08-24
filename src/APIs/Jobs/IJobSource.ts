import { IJobSearchResult } from "./IJobSearchResult";
import { JobPostingDetail } from "./types/JobPostingDetail";

interface IJobSource {
    search(): Promise<IJobSearchResult[]>;

    getDetail(
        job: IJobSearchResult,
    ): Promise<JobPostingDetail>;
}