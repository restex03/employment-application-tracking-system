import { IJobRequirement } from "../../RequirementsExtraction/IJobRequirement";

export interface IJobRequirementTransferableMatch {
    requirement: IJobRequirement;
    isTransferableMatch: boolean;
    evidence: string | null;
}
