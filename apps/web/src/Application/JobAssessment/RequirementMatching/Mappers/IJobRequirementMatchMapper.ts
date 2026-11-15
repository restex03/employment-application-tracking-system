import { IJobRequirementDirectMatch } from "../DirectMatching/IJobRequirementDirectMatch";
import { IJobRequirementMatch } from "../IJobRequirementMatch";
import { IJobRequirementTransferableMatch } from "../TransferableMatching/IJobRequirementTransferableMatch";

export interface IJobRequirementMatchMapper {
    map(
        directMatch: IJobRequirementDirectMatch,
        transferableMatch?: IJobRequirementTransferableMatch
    ): IJobRequirementMatch;
}
