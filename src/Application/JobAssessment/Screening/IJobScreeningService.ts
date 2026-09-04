import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreeningService {
    screenList(jobs: IJobPostDiscovery[]): Promise<IJobScreenResult[]>;
    screen(job: IJobPostDiscovery): Promise<IJobScreenResult>;
}
