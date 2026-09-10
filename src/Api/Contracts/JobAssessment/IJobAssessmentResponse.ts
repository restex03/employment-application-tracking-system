import { JobAssessmentStatus, JobAssessmentReviewStatus } from "../../../Domain/JobAssessment/IJobAssessment";
import { IJobMatchScore } from "../../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { IJobRequirementMatch } from "../../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";
import { IClassifiedJobRequirement } from "../../../Application/JobAssessment/RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../../../Application/JobAssessment/Screening/IJobScreenResult";

export interface IJobAssessmentResponse {
    readonly id: string;
    readonly candidateProfileId: string;
    readonly jobPostId: string;
    readonly createdAt: Date;

    readonly status: JobAssessmentStatus;
    readonly reviewStatus: JobAssessmentReviewStatus;

    readonly screenResult?: IJobScreenResult;
    readonly requirements: readonly IClassifiedJobRequirement[];
    readonly requirementMatches: readonly IJobRequirementMatch[];
    readonly jobMatchScore?: IJobMatchScore;
}
