import { IJobSearchResult } from "../../../Infrastructure/APIs/JobSources/IJobSearchResult";

export interface IJobFetchService {
    fetchJobs(): Promise<IJobSearchResult[]>;
}
