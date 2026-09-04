import { IJobPostDetail } from "../../Domain/JobPosts/IJobPostDetail";
import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";

export interface IJobPostDiscoveryService {
    fetchList(searchText?: string): Promise<IJobPostDiscovery[]>;
    /**@deprecated Use fetchDetail instead */
    fetchDetails(jobLookups: Pick<IJobPostDiscovery, "detailPath">[]): Promise<IJobPostDetail[]>;
    fetchDetail(jobLookup: Pick<IJobPostDiscovery, "detailPath">): Promise<IJobPostDetail>;
}
