import { IJobCompatibilityScoreCalculator } from "../../Domain/JobAssessment/Scoring/IJobCompatibilityScoreCalculator";
import { JobCompatibilityScoreCalculator } from "../../Domain/JobAssessment/Scoring/JobCompatibilityScoreCalculator";

export type GapSeverity = "minor" | "moderate" | "major";

export type GapCategory =
    "technical_skill" | "technical_skill_depth" | "domain_experience" | "role_scope" | "career_alignment";

export interface IJobScore {
    currentSkillFit: number;
    experienceFit: number;
    workFit: number;
    skillPortability: number;
    careerGrowth: number;
}

export interface IJobScoreGap {
    area: string;
    severity: GapSeverity;
    category: GapCategory;
    reason: string;
}

export type StrengthType = "direct" | "transferable";

export interface IJobScoreStrength {
    area: string;
    type: StrengthType;
    reason: string;
}

export interface IJobMatchEvidence {
    title: string;
    strengths: IJobScoreStrength[];
    gaps: IJobScoreGap[];
}

export interface IJobScoreEvaluation {
    title: string;
    scores: IJobScore;
    overallScore(): number;
}

export class JobMatchEvidence implements IJobMatchEvidence {
    private readonly calculator: IJobCompatibilityScoreCalculator = new JobCompatibilityScoreCalculator();
    constructor(
        public readonly title: string,
        public readonly strengths: IJobScoreStrength[],
        public readonly gaps: IJobScoreGap[]
    ) {}
}
