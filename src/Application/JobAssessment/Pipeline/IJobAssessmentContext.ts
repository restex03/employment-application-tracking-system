import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IWorkdayJobSource } from "../../../Infrastructure/JobSources/Workday/IWorkdayJobSource";
import { IJobRequirementMatch } from "../RequirementMatching/IJobRequirementMatch";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../Screening/IJobScreenResult";

export interface IJobAssessmentContext {
    jobSource: IWorkdayJobSource;
    candidateProfile: ICandidateProfile;
    job: IJobPost;
    screenResult: IJobScreenResult | undefined;
    jobDetail: IJobPostDetail | undefined;
    requirements: IJobRequirement[] | undefined;
    classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
}

export class JobAssessmentContext implements IJobAssessmentContext {
    constructor(candidateProfile: ICandidateProfile, jobLookup: IJobPost, jobSource: IWorkdayJobSource) {
        this.candidateProfile = candidateProfile;
        this.job = jobLookup;
        this.jobSource = jobSource;
    }
    public readonly candidateProfile: ICandidateProfile;
    public readonly job: IJobPost;
    public readonly jobSource: IWorkdayJobSource;
    public screenResult: IJobScreenResult | undefined;
    public jobDetail: IJobPostDetail | undefined;
    public requirements: IJobRequirement[] | undefined;
    public classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    requirementMatches: IJobRequirementMatch[] | undefined;
}
