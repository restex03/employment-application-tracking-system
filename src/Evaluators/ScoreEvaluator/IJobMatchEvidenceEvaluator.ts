import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { IJobPostDetail } from "../../Domain/JobPosts/IJobPostDetail";
import { IJobMatchEvidence } from "./IJobMatchEvidence";

export interface IJobMatchEvidenceEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostDetail): Promise<IJobMatchEvidence>;
}
