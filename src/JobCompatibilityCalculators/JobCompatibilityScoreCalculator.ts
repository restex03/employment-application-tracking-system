import { IJobScore } from "../Evaluators/ScoreEvaluator/IJobMatchEvidence";
import { IJobCompatibilityScoreCalculator } from "./IJobCompatibilityScoreCalculator";

const SCORE_WEIGHTS = {
    currentSkillFit: 0.3,
    experienceFit: 0.25,
    workFit: 0.2,
    skillPortability: 0.1,
    careerGrowth: 0.1,
} as const satisfies Record<keyof IJobScore, number>;

const TOTAL_WEIGHT = Object.values(SCORE_WEIGHTS).reduce((total, weight) => total + weight, 0);

export class JobCompatibilityScoreCalculator implements IJobCompatibilityScoreCalculator {
    public calculate(scores: IJobScore): number {
        let weightedScore = 0;

        for (const key of Object.keys(SCORE_WEIGHTS) as Array<keyof IJobScore>) {
            weightedScore += scores[key] * SCORE_WEIGHTS[key];
        }

        return Math.round(weightedScore / TOTAL_WEIGHT);
    }
}
