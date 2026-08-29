import { IJobSearchResult } from "../Infrastructure/APIs/JobSources/IJobSearchResult";

export interface IJobFetcher {
    fetchJobs(): Promise<IJobSearchResult[]>;
}
