export interface IJobMatchScore {
    score: number;

    totalRequirements: number;
    directMatches: number;
    transferableMatches: number;
    missingMatches: number;
}
