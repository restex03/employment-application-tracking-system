import { IJobScore } from "../Evaluators/ScoreEvaluator/IJobMatchEvidence";

export interface IJobCompatibilityScoreCalculator {
    calculate(scores: IJobScore): number;
}
