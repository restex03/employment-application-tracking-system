import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { type ICandidateProfile, type IJobMatchEvaluation } from "./types";

export interface IJobMatchEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobMatchEvaluation>;
}
