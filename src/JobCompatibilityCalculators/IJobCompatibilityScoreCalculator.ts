import { IJobEvaluation } from "../JobEvaluators/Groq/types";

export interface IJobCompatibilityScoreCalculator {
    calculate(evaluation: Pick<IJobEvaluation, "scores" | "eligibility">): number;
}
