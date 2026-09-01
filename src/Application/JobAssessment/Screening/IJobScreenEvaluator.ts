import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobScreenResult } from "./IJobScreenResult";

export interface IJobScreenEvaluator {
    evaluate(job: IJobPostLookup): Promise<IJobScreenResult>;
}
