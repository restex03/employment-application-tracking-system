import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { IClassifiedJobRequirement } from "../../RequirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatch } from "./IJobRequirementDirectMatch";

export interface IJobRequirementDirectMatchingService {
    assess(requirement: IClassifiedJobRequirement, profile: ICandidateProfile): Promise<IJobRequirementDirectMatch>;
}
