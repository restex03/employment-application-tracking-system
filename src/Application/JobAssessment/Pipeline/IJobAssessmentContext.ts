import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobRequirementMatch } from "../RequirementMatching/IJobRequirementMatch";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../Screening/IJobScreenResult";

export interface IJobAssessmentContext {
    candidateProfile: ICandidateProfile;
    job: IJobPostLookup;
    screenResult: IJobScreenResult | undefined;
    jobDetail: IJobPostDetail | undefined;
    requirements: IJobRequirement[] | undefined;
    classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
}

export class JobAssessmentContext implements IJobAssessmentContext {
    constructor(candidateProfile: ICandidateProfile, jobLookup: IJobPostLookup) {
        this.candidateProfile = candidateProfile;
        this.job = jobLookup;
    }
    public readonly candidateProfile: ICandidateProfile;
    public readonly job: IJobPostLookup;
    public screenResult: IJobScreenResult | undefined;
    public jobDetail: IJobPostDetail | undefined;
    public requirements: IJobRequirement[] | undefined;
    public classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
}
