import { IClassifiedJobRequirement } from "../../RequirementClassification/IClassifiedJobRequirement";

export interface IJobRequirementTransferableMatch {
    requirement: IClassifiedJobRequirement;
    isTransferableMatch: boolean;
    evidence: string | null;
}
