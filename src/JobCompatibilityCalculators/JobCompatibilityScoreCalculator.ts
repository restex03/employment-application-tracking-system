import { IJobEvaluation } from "../JobEvaluators/Groq/types";
import { IJobCompatibilityScoreCalculator } from "./IJobCompatibilityScoreCalculator";

export class JobCompatibilityScoreCalculator implements IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobEvaluation, "scores" | "eligibility">): number {
        if (!evaluation.eligibility.passesHardConstraints) {
            return 0;
        }

        const scores = evaluation.scores;

        const overallScore =
            scores.currentSkillFit * 0.25 +
            scores.experienceFit * 0.15 +
            scores.workFit * 0.2 +
            scores.skillPortability * 0.15 +
            scores.careerGrowth * 0.15 +
            scores.compensationFit * 0.05 +
            scores.locationFit * 0.05;

        return Math.round(overallScore);
    }
}
