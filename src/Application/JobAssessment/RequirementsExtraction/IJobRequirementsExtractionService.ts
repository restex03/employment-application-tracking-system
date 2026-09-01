import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobRequirement } from "./IJobRequirementsResult";

export interface IJobRequirementsExtractionService {
    extract(job: IJobPostDetail): Promise<IJobRequirement[]>;
}
