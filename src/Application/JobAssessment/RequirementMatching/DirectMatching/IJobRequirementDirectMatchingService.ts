import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { IJobRequirement } from "../../RequirementsExtraction/IJobRequirement";
import { IJobRequirementDirectMatch } from "./IJobRequirementDirectMatch";

export interface IJobRequirementDirectMatchingService {
    assess(requirement: IJobRequirement, profile: ICandidateProfile): Promise<IJobRequirementDirectMatch>;
}
