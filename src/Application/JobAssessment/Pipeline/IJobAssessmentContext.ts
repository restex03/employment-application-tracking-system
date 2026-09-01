import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../Screening/IJobScreenResult";

export interface IJobAssessmentContext {
    job: IJobPostLookup;
    screenResult: IJobScreenResult | undefined;
    jobDetail: IJobPostDetail | undefined;
    requirements: IJobRequirement[] | undefined;
    classifiedRequirements: IClassifiedJobRequirement[] | undefined;
}

export class JobAssessmentContext implements IJobAssessmentContext {
    public readonly job: IJobPostLookup;
    public screenResult: IJobScreenResult | undefined;
    public jobDetail: IJobPostDetail | undefined;
    public requirements: IJobRequirement[] | undefined;
    public classifiedRequirements: IClassifiedJobRequirement[] | undefined;

    constructor(jobLookup: IJobPostLookup) {
        this.job = jobLookup;
    }
}
