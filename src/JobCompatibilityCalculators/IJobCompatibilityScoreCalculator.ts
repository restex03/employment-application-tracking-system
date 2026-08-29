import { IJobEvaluation } from "../JobEvaluators/types";

export interface IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobEvaluation, "scores" | "eligibility">): number;
}
