import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementTransferableMatch } from "./IJobRequirementTransferableMatch";

export interface IJobRequirementTransferableMatchingService {
    assess(
        requirement: IClassifiedJobRequirement,
        profile: ICandidateProfile
    ): Promise<IJobRequirementTransferableMatch>;
}
