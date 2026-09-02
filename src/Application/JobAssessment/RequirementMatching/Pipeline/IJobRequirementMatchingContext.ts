import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatch } from "../DirectMatching/IJobRequirementDirectMatch";
import { IJobRequirementMatch } from "../IJobRequirementMatch";
import { IJobRequirementTransferableMatch } from "../TransferableMatching/IJobRequirementTransferableMatch";

export interface IJobRequirementMatchingContext {
    requirement: IClassifiedJobRequirement;
    profile: ICandidateProfile;

    directMatch?: IJobRequirementDirectMatch;
    transferableMatch?: IJobRequirementTransferableMatch;

    match?: IJobRequirementMatch;
}
