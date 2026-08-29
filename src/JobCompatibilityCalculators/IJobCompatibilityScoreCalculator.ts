import { IJobEvaluation } from "../Evaluators/ShortlistEvaluator/types";

export interface IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobEvaluation, "scores" | "eligibility">): number;
}
