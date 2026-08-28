import { IJobPostingDetail } from "../APIs/JobSources/IJobPostingDetail";
import { type ICandidateProfile, type IJobEvaluation } from "./Groq/types";

export interface IJobEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobEvaluation>;
}
