import { IJobScoreEvaluation } from "../Evaluators/ScoreEvaluator/types";

export interface IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobScoreEvaluation, "scores" | "eligibility">): number;
}
