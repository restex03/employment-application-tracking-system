import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { type ICandidateProfile, type IJobScoreEvaluation as IJobScoringEvaluation } from "./types";

export interface IJobScoreEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobScoringEvaluation>;
}
