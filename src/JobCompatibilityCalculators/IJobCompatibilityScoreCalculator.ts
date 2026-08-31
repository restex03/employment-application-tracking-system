import { IJobScore } from "../Evaluators/ScoreEvaluator/IJobScoreEvaluation";

export interface IJobCompatibilityScoreCalculator {
    calculate(scores: IJobScore): number;
}
