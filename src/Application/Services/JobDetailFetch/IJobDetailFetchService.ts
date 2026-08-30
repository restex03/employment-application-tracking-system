import { IJobPostingDetail } from "../../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { IJobSearchResult } from "../../../Infrastructure/APIs/JobSources/IJobSearchResult";

export interface IJobDetailFetchService {
    fetchJobDetails(jobLookups: IJobSearchResult[]): Promise<IJobPostingDetail[]>;
}
