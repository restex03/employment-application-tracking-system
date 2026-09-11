import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobMatchScore } from "../../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobSource } from "../../../Domain/JobSources/IJobSource";
import { IJobRequirementMatch } from "../RequirementMatching/IJobRequirementMatch";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../Screening/IJobScreenResult";

export interface IJobAssessmentContext {
    jobSource: IJobSource;
    candidateProfile: ICandidateProfile;
    job: IJobPost;
    screenResult: IJobScreenResult | undefined;
    jobDetail: IJobPostDetail | undefined;
    requirements: IJobRequirement[] | undefined;
    classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
    jobMatchScore: IJobMatchScore | undefined;
}

export class JobAssessmentContext implements IJobAssessmentContext {
    constructor(candidateProfile: ICandidateProfile, jobLookup: IJobPost, jobSource: IJobSource) {
        this.candidateProfile = candidateProfile;
        this.job = jobLookup;
        this.jobSource = jobSource;
    }
    jobMatchScore: IJobMatchScore | undefined;
    public readonly candidateProfile: ICandidateProfile;
    public readonly job: IJobPost;
    public readonly jobSource: IJobSource;
    public screenResult: IJobScreenResult | undefined;
    public jobDetail: IJobPostDetail | undefined;
    public requirements: IJobRequirement[] | undefined;
    public classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    public requirementMatches: IJobRequirementMatch[] | undefined;
}
