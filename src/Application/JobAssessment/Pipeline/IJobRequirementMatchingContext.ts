import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobRequirementDirectMatch } from "../RequirementMatching/DirectMatching/IJobRequirementDirectMatch";
import { IJobRequirementMatch } from "../RequirementMatching/IJobRequirementMatch";
import { IJobRequirementTransferableMatch } from "../RequirementMatching/TransferableMatching/IJobRequirementTransferableMatch";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";

export interface IJobRequirementMatchingContext {
    requirement: IJobRequirement;
    profile: ICandidateProfile;

    directMatch?: IJobRequirementDirectMatch;
    transferableMatch?: IJobRequirementTransferableMatch;

    match?: IJobRequirementMatch;
}
