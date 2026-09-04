import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";

export interface IJobPostService {
    storeDiscoveredJobs(discoveries: IJobPostDiscovery[]): Promise<void>;
}
