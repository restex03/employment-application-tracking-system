import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";

export type JobRequirementMatchType = "direct" | "transferable" | "missing";

export interface IJobRequirementMatch {
    requirement: IClassifiedJobRequirement;
    matchType: JobRequirementMatchType;
    evidence: string | null;
}
