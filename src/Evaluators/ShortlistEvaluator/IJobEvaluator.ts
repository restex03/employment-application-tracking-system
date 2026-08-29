import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { type ICandidateProfile, type IJobEvaluation } from "./types";

export interface IJobEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobEvaluation>;
}
