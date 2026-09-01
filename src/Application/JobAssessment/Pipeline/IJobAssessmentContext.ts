import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobMatchEvidence, IJobScore } from "../../../Evaluators/ScoreEvaluator/IJobMatchEvidence";

export interface IJobAssessmentContext {
    job: IJobPostDetail;
    evidence?: IJobMatchEvidence;
    score?: IJobScore;
}
