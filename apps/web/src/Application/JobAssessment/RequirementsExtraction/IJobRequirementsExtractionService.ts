import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobRequirement } from "./IJobRequirement";

export interface IJobRequirementsExtractionService {
    extract(job: IJobPostDetail): Promise<IJobRequirement[]>;
}
