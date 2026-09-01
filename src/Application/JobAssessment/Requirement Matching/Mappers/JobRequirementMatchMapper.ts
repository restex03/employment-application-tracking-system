import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementMatch } from "../IJobRequirementMatch";
import { IJobRequirementMatchResponse } from "../IJobRequirementMatchResponse";

export class JobRequirementMatchMapper {
    public map(
        requirements: IClassifiedJobRequirement[],
        matches: IJobRequirementMatchResponse[]
    ): IJobRequirementMatch[] {
        if (matches.length !== requirements.length) {
            throw new Error(`Expected ${requirements.length} requirement matches but received ${matches.length}.`);
        }

        const matchByIndex = new Map<number, IJobRequirementMatchResponse>();

        for (const match of matches) {
            if (match.index < 0 || match.index >= requirements.length) {
                throw new Error(`Invalid requirement match index ${match.index}.`);
            }

            if (matchByIndex.has(match.index)) {
                throw new Error(`Duplicate requirement match index ${match.index}.`);
            }

            matchByIndex.set(match.index, match);
        }

        return requirements.map((requirement, index): IJobRequirementMatch => {
            const match = matchByIndex.get(index);

            if (!match) {
                throw new Error(`Missing match for requirement index ${index}.`);
            }

            if (match.matchType !== "missing" && !match.evidence) {
                throw new Error(`Missing evidence for ${match.matchType} match at index ${index}.`);
            }

            if (match.matchType === "missing" && match.evidence) {
                throw new Error(`Unexpected evidence for missing match at index ${index}.`);
            }

            return {
                requirement,
                matchType: match.matchType,
                evidence: match.matchType === "missing" ? null : match.evidence,
            };
        });
    }
}
