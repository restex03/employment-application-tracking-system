import { IJobScore } from "./IJobScore";

export interface IJobCompatibilityScoreCalculator {
    calculate(scores: IJobScore): number;
}
