export type JobAssessmentStatus = "complete" | "incomplete";
export type JobAssessmentReviewStatus = "unreviewed" | "accepted" | "flagged";

export type JobRequirementCategory =
    | "technical_skill"
    | "technical_skill_depth"
    | "domain_experience"
    | "role_scope"
    | "education"
    | "certification"
    | "other";

export interface IJobRequirement {
    area: string;
    description: string;
}

export interface IClassifiedJobRequirement extends IJobRequirement {
    category: JobRequirementCategory;
}

export type JobRequirementMatchType = "direct" | "transferable" | "missing";

export interface IJobRequirementMatch {
    requirement: IClassifiedJobRequirement;
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
    requirements: IClassifiedJobRequirement[];
    requirementMatches: IJobRequirementMatch[];
    jobMatchScore?: IJobMatchScore;
}
