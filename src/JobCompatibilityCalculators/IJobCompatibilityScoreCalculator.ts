import { IJobMatchEvaluation } from "../Evaluators/ShortlistEvaluator/types";

export interface IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobMatchEvaluation, "scores" | "eligibility">): number;
}
