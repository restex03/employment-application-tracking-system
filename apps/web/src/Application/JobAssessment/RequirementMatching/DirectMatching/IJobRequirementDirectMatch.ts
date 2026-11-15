import { IJobRequirement } from "../../RequirementsExtraction/IJobRequirement";

export interface IJobRequirementDirectMatch {
    requirement: IJobRequirement;
    isDirectMatch: boolean;
    evidence: string | null;
}
