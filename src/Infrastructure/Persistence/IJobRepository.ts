import { IJobPostLookup } from "../../Domain/JobPosts/IJobPostLookup";

export interface IJobRepository {
    exists(source: string, sourceJobId: string): Promise<boolean>;

    add(source: string, job: IJobPostLookup): Promise<void>;

    addMany(source: string, jobs: IJobPostLookup[]): Promise<void>;
}
