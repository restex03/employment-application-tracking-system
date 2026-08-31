import { IJobCompatibilityScoreCalculator } from "../../JobCompatibilityCalculators/IJobCompatibilityScoreCalculator";
import { JobCompatibilityScoreCalculator } from "../../JobCompatibilityCalculators/JobCompatibilityScoreCalculator";

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

export interface IJobScoreEvaluation {
    title: string;
    scores: IJobScore;
    strengths: IJobScoreStrength[];
    gaps: IJobScoreGap[];
    overallScore(): number;
}

export class JobScoreEvaluation implements IJobScoreEvaluation {
    private readonly calculator: IJobCompatibilityScoreCalculator = new JobCompatibilityScoreCalculator();
    constructor(
        public readonly title: string,
        public readonly scores: IJobScore,
        public readonly strengths: IJobScoreStrength[],
        public readonly gaps: IJobScoreGap[]
    ) {}

    overallScore(): number {
        if (!this.scores) {
            throw new Error(
                "[JobScoreEvaluation] Unable to calculate overall score - member property scores is null or undefined. "
            );
        }
        return this.calculator.calculate(this.scores);
    }
}
