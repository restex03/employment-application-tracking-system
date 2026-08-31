import { IJobPostDetail } from "../../Domain/JobPosts/IJobPostDetail";
import { IJobPostLookup } from "../../Domain/JobPosts/IJobPostLookup";

export interface IJobPostFetchService {
    fetchLookups(searchText?: string): Promise<IJobPostLookup[]>;
    fetchDetails(jobLookups: IJobPostLookup[]): Promise<IJobPostDetail[]>;
}
