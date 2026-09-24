import { IClassifiedJobRequirement } from "../../RequirementClassification/IClassifiedJobRequirement";

export interface IJobRequirementDirectMatch {
    requirement: IClassifiedJobRequirement;
    isDirectMatch: boolean;
    evidence: string | null;
}
