import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/IWorkdayJobSource";
import { IJobPostDiscoveryService } from "./IJobPostDiscoveryService";

export interface IJobPostDiscoveryServiceFactory {
    create(source: IWorkdayJobSource): IJobPostDiscoveryService;
}
