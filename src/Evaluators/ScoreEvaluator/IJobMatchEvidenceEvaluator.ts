import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { type ICandidateProfile } from "./types";
import { IJobMatchEvidence } from "./IJobMatchEvidence";

export interface IJobMatchEvidenceEvaluator {
    evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobMatchEvidence>;
}
