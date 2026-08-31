import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";

export interface IJobDetailFetchService {
    fetchJobDetails(jobLookups: IJobPostLookup[]): Promise<IJobPostDetail[]>;
}
