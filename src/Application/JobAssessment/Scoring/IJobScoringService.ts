import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobMatchEvidence } from "../../../Evaluators/ScoreEvaluator/IJobMatchEvidence";

export interface IJobScoringService {
    score(profile: ICandidateProfile, jobs: IJobPostDetail[]): Promise<IJobMatchEvidence[]>;
}
