import { IJobRequirementMatch } from "../../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";
import { IJobMatchScore } from "./IJobMatchScore";

export interface IJobMatchScoreCalculator {
    calculate(matches: IJobRequirementMatch[]): IJobMatchScore;
}
