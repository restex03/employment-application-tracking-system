import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/IWorkdayJobSource";
import { IJobPostDiscoveryService } from "./IJobPostDiscoveryService";

export interface IJobPostDiscoveryServiceFactory {
    createJobPostDiscoveryService(source: IWorkdayJobSource): IJobPostDiscoveryService;
}
