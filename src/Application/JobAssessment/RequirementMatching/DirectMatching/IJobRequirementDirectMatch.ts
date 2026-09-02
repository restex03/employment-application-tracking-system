import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";

export interface IJobRequirementDirectMatch {
    requirement: IClassifiedJobRequirement;
    isDirectMatch: boolean;
    evidence: string | null;
}
