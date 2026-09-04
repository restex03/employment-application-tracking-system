import { IJobGateway } from "../../Domain/JobPosts/IJobSource";
import { IJobPostDiscoveryService } from "../JobPostDiscovery/IJobPostDiscoveryService";

export interface ISourceDependencies {
    jobGateway: IJobGateway;
    jobFetchService: IJobPostDiscoveryService;
}
