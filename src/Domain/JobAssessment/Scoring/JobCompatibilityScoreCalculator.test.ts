import { describe, expect, it } from "vitest";

import { JobMatchScoreCalculator } from "./JobMatchScoreCalculator";
import { IJobRequirementMatch } from "../../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";

describe("JobMatchScoreCalculator", () => {
    const calculator = new JobMatchScoreCalculator();

    function createMatch(matchType: "direct" | "transferable" | "missing"): IJobRequirementMatch {
        return {
            requirement: {
                area: "Test",
                description: "Test requirement",
                category: "technical_skill",
            },
            matchType,
            evidence: matchType === "missing" ? null : "Test evidence",
        };
    }

    it("returns 100 when all requirements are direct matches", () => {
        const result = calculator.calculate([createMatch("direct"), createMatch("direct"), createMatch("direct")]);

        expect(result).toEqual({
            score: 100,
            totalRequirements: 3,
            directMatches: 3,
            transferableMatches: 0,
            missingMatches: 0,
        });
    });

    it("returns 50 when all requirements are transferable matches", () => {
        const result = calculator.calculate([createMatch("transferable"), createMatch("transferable")]);

        expect(result.score).toBe(50);
    });

    it("returns 0 when all requirements are missing", () => {
        const result = calculator.calculate([createMatch("missing"), createMatch("missing")]);

        expect(result.score).toBe(0);
    });

    it("calculates a weighted score from mixed match types", () => {
        const result = calculator.calculate([
            createMatch("direct"),
            createMatch("direct"),
            createMatch("transferable"),
            createMatch("missing"),
        ]);

        // (1 + 1 + 0.5 + 0) / 4 = 0.625
        expect(result.score).toBe(63);

        expect(result.directMatches).toBe(2);
        expect(result.transferableMatches).toBe(1);
        expect(result.missingMatches).toBe(1);
        expect(result.totalRequirements).toBe(4);
    });

    it("throws when there are no requirement matches", () => {
        expect(() => calculator.calculate([])).toThrow("Cannot calculate job match score without requirement matches.");
    });
});
