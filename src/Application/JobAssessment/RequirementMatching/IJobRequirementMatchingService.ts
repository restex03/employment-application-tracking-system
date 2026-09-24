import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IClassifiedJobRequirement } from "../RequirementClassification/IClassifiedJobRequirement";
import { IJobRequirementMatch } from "./IJobRequirementMatch";

export interface IJobRequirementsMatchingService {
    match(requirements: IClassifiedJobRequirement[], profile: ICandidateProfile): Promise<IJobRequirementMatch[]>;

    matchSingle(requirement: IClassifiedJobRequirement, profile: ICandidateProfile): Promise<IJobRequirementMatch>;
}
