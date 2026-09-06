import { IJobRequirementMatch } from "../../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";
import { IJobMatchScore } from "./IJobMatchScore";

export class JobMatchScoreCalculator {
    public calculate(matches: IJobRequirementMatch[]): IJobMatchScore {
        if (matches.length === 0) {
            throw new Error("Cannot calculate job match score without requirement matches.");
        }

        let directMatches = 0;
        let transferableMatches = 0;
        let missingMatches = 0;

        for (const match of matches) {
            switch (match.matchType) {
                case "direct":
                    directMatches++;
                    break;

                case "transferable":
                    transferableMatches++;
                    break;

                case "missing":
                    missingMatches++;
                    break;
            }
        }

        const weightedMatches = directMatches + transferableMatches * 0.5;

        const score = Math.round((weightedMatches / matches.length) * 100);

        return {
            score,
            totalRequirements: matches.length,
            directMatches,
            transferableMatches,
            missingMatches,
        };
    }
}
