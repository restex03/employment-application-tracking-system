import { IJobScoreEvaluation } from "../Evaluators/ShortlistEvaluator/types";

export interface IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobScoreEvaluation, "scores" | "eligibility">): number;
}
