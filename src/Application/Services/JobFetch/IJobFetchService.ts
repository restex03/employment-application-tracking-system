import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";

export interface IJobFetchService {
    fetchJobs(searchText?: string): Promise<IJobPostLookup[]>;
}
