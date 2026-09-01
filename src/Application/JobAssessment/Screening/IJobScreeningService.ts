import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreeningService {
    screenList(jobs: IJobPostLookup[]): Promise<IJobScreenResult[]>;
    screen(job: IJobPostLookup): Promise<IJobScreenResult>;
}
