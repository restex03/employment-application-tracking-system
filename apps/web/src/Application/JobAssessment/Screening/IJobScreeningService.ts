import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreeningService {
    screenList(jobs: IJobPost[]): Promise<IJobScreenResult[]>;
    screen(job: IJobPost): Promise<IJobScreenResult>;
}
