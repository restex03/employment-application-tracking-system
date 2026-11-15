import { JobRequirementMatchType } from "./IJobRequirementMatch";

export interface IJobRequirementMatchResponse {
    index: number;
    matchType: JobRequirementMatchType;
    evidence: string | null;
}
