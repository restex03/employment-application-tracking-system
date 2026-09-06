import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobRequirementDirectMatch } from "../RequirementMatching/DirectMatching/IJobRequirementDirectMatch";
import { IJobRequirementMatch } from "../RequirementMatching/IJobRequirementMatch";
import { IJobRequirementTransferableMatch } from "../RequirementMatching/TransferableMatching/IJobRequirementTransferableMatch";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";

export interface IJobRequirementMatchingContext {
    requirement: IClassifiedJobRequirement;
    profile: ICandidateProfile;

    directMatch?: IJobRequirementDirectMatch;
    transferableMatch?: IJobRequirementTransferableMatch;

    match?: IJobRequirementMatch;
}
