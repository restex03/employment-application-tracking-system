import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";

export interface IJobPostService {
    storeDiscoveredJobs(discoveries: IJobPostDiscovery[]): Promise<void>;

    getAll(): Promise<IJobPost[]>;

    getById(id: string): Promise<IJobPost | undefined>;
}
