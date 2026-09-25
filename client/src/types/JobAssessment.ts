export type JobAssessmentStatus = "complete" | "incomplete" | "unknown";
export type JobAssessmentReviewStatus = "unreviewed" | "accepted" | "flagged";

export interface IJobRequirement {
    name: string[];
    type: "single" | "and" | "or";
    sentenceCapture: string;
}

export type JobRequirementMatchType = "direct" | "transferable" | "missing";

export interface IJobRequirementMatch {
    requirement: IJobRequirement;
    matchType: JobRequirementMatchType;
    evidence: string | null;
}

export interface IJobMatchScore {
    score: number;
    totalRequirements: number;
    directMatches: number;
    transferableMatches: number;
    missingMatches: number;
}

export type JobScreenDisposition = "advance" | "reject" | "review";

export interface IJobScreenResult {
    disposition: JobScreenDisposition;
    reason: string;
}

export interface IJobAssessment {
    id: string;
    candidateProfileId: string;
    jobPostId: string;
    createdAt: string;
    status: JobAssessmentStatus;
    reviewStatus: JobAssessmentReviewStatus;
    screenResult?: IJobScreenResult;
    requirements: IJobRequirement[];
    requirementMatches: IJobRequirementMatch[];
    jobMatchScore?: IJobMatchScore;
}
