import { IJobRequirementDirectMatch } from "../DirectMatching/IJobRequirementDirectMatch";
import { IJobRequirementMatch } from "../IJobRequirementMatch";
import { IJobRequirementTransferableMatch } from "../TransferableMatching/IJobRequirementTransferableMatch";

export class JobRequirementMatchMapper {
    public map(
        directMatch: IJobRequirementDirectMatch,
        transferableMatch?: IJobRequirementTransferableMatch
    ): IJobRequirementMatch {
        if (directMatch.isDirectMatch) {
            if (!directMatch.evidence) {
                throw new Error(`Direct match is missing evidence: ${directMatch.requirement.area}`);
            }

            return {
                requirement: directMatch.requirement,
                matchType: "direct",
                evidence: directMatch.evidence,
            };
        }

        if (directMatch.evidence !== null) {
            throw new Error(`Non-direct match contains unexpected evidence: ${directMatch.requirement.area}`);
        }

        if (!transferableMatch) {
            throw new Error(`Transferability assessment is missing: ${directMatch.requirement.area}`);
        }

        if (transferableMatch.requirement !== directMatch.requirement) {
            throw new Error(
                `Requirement mismatch between direct and transferable assessments: ${directMatch.requirement.area}`
            );
        }

        if (transferableMatch.isTransferableMatch) {
            if (!transferableMatch.evidence) {
                throw new Error(`Transferable match is missing evidence: ${directMatch.requirement.area}`);
            }

            return {
                requirement: directMatch.requirement,
                matchType: "transferable",
                evidence: transferableMatch.evidence,
            };
        }

        if (transferableMatch.evidence !== null) {
            throw new Error(`Non-transferable match contains unexpected evidence: ${directMatch.requirement.area}`);
        }

        return {
            requirement: directMatch.requirement,
            matchType: "missing",
            evidence: null,
        };
    }
}
