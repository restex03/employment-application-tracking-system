import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { type ICandidateProfile } from "./types";
import { type IJobScoreEvaluation } from "./IJobScoreEvaluation";

export interface IJobScoreEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobScoreEvaluation>;
}
