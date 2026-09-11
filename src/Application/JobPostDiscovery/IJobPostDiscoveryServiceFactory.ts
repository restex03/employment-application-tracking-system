import { IJobSource } from "../../Domain/JobSources/IJobSource";
import { IJobPostDiscoveryService } from "./IJobPostDiscoveryService";

export interface IJobPostDiscoveryServiceFactory {
    create(source: IJobSource): IJobPostDiscoveryService;
}
