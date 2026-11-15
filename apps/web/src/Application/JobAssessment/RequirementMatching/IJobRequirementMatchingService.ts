import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IJobRequirementMatch } from "./IJobRequirementMatch";

export interface IJobRequirementsMatchingService {
    match(requirements: IJobRequirement[], profile: ICandidateProfile): Promise<IJobRequirementMatch[]>;

    matchSingle(requirement: IJobRequirement, profile: ICandidateProfile): Promise<IJobRequirementMatch>;
}
