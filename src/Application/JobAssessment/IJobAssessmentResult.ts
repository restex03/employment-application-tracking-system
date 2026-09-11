import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { IJobMatchScore } from "../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostDetail } from "../../Domain/JobPosts/IJobPostDetail";
import { IJobSource } from "../../Domain/JobSources/IJobSource";
import { PipelineStepStatus } from "../Pipelines/IPipelineStepResult";
import { IJobRequirementMatch } from "./RequirementMatching/IJobRequirementMatch";
import { IJobRequirement } from "./RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "./RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "./Screening/IJobScreenResult";

/** Temporary until we incorporate async jobs for running assessments */
export interface IJobAssessmentResult {
    readonly status: "complete" | "incomplete";

    readonly jobSource: IJobSource;
    readonly candidateProfile: ICandidateProfile;
    readonly job: IJobPost;

    readonly screenResult: IJobScreenResult | undefined;
    readonly requirements: IJobRequirement[] | undefined;
    readonly classifiedRequirements: IClassifiedJobRequirement[] | undefined;
    readonly requirementMatches: IJobRequirementMatch[] | undefined;
    readonly jobMatchScore: IJobMatchScore | undefined;
}
