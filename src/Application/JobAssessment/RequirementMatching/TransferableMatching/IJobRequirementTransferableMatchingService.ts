import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { IJobRequirement } from "../../RequirementsExtraction/IJobRequirement";
import { IJobRequirementTransferableMatch } from "./IJobRequirementTransferableMatch";

export interface IJobRequirementTransferableMatchingService {
    assess(
        requirement: IJobRequirement,
        profile: ICandidateProfile
    ): Promise<IJobRequirementTransferableMatch>;
}
