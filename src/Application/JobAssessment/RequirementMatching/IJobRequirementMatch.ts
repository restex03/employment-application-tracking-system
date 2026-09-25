import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";

export type JobRequirementMatchType = "direct" | "transferable" | "missing";

export interface IJobRequirementMatch {
    requirement: IJobRequirement;
    matchType: JobRequirementMatchType;
    evidence: string | null;
}
