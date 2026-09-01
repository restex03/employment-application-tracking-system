import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreeningService {
    screen(jobs: IJobPostLookup[]): Promise<IJobScreenResult[]>;
}
