import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";
import { IJobRequirementMatch } from "../RequirementMatching/IJobRequirementMatch";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../Screening/IJobScreenResult";

export interface IJobAssessmentContext {
    candidateProfile: ICandidateProfile;
    job: IJobPostDiscovery;
    screenResult: IJobScreenResult | undefined;
    jobDetail: IJobPostDetail | undefined;
    requirements: IJobRequirement[] | undefined;
    classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
}

export class JobAssessmentContext implements IJobAssessmentContext {
    constructor(candidateProfile: ICandidateProfile, jobLookup: IJobPostDiscovery) {
        this.candidateProfile = candidateProfile;
        this.job = jobLookup;
    }
    public readonly candidateProfile: ICandidateProfile;
    public readonly job: IJobPostDiscovery;
    public screenResult: IJobScreenResult | undefined;
    public jobDetail: IJobPostDetail | undefined;
    public requirements: IJobRequirement[] | undefined;
    public classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
}
