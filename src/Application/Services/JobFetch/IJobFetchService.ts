import { IJobSearchResult } from "../../../Infrastructure/APIs/JobSources/IJobSearchResult";

export interface IJobFetchService {
    fetchJobs(searchText?: string): Promise<IJobSearchResult[]>;
}
