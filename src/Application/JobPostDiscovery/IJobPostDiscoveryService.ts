import { IJobPostDetail } from "../../Domain/JobPosts/IJobPostDetail";
import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";

export interface IJobPostDiscoveryService {
    fetchLookups(searchText?: string): Promise<IJobPostDiscovery[]>;
    /**@deprecated Use fetchDetail instead */
    fetchDetails(jobLookups: IJobPostDiscovery[]): Promise<IJobPostDetail[]>;
    fetchDetail(jobLookup: IJobPostDiscovery): Promise<IJobPostDetail>;
}
