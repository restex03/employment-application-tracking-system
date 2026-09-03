import { IJobPostDetail } from "../../Domain/JobPosts/IJobPostDetail";
import { IJobPostLookup } from "../../Domain/JobPosts/IJobPostLookup";

export interface IJobRepository {
    add(source: string, job: IJobPostLookup): Promise<void>;
    getJobPostCount(): Promise<number>;
    addLookupsIfNotExists(source: string, jobs: IJobPostLookup[]): Promise<void>;
    addDetailsIfNotExists(source: string, jobs: IJobPostDetail[]): Promise<void>;
}
