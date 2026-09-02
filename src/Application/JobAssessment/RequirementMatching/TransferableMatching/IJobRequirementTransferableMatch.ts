import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";

export interface IJobRequirementTransferableMatch {
    requirement: IClassifiedJobRequirement;
    isTransferableMatch: boolean;
    evidence: string | null;
}
