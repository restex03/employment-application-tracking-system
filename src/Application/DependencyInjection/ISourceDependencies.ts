import { IJobGateway } from "../../Infrastructure/JobSources/IJobGateway";
import { IJobPostDiscoveryService } from "../JobPostDiscovery/IJobPostDiscoveryService";

export interface ISourceDependencies {
    jobGateway: IJobGateway;
    jobFetchService: IJobPostDiscoveryService;
}
