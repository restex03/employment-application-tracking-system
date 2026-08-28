import { describe, expect, it } from "vitest";
import { JobCompatibilityScoreCalculator } from "./JobCompatibilityScoreCalculator";

describe("JobCompatibilityScoreCalculator", () => {
    const calculator = new JobCompatibilityScoreCalculator();

    it("calculates the weighted compatibility score", () => {
        const score = calculator.calculate({
            eligibility: {
                passesHardConstraints: true,
                reasons: [],
            },
            scores: {
                currentSkillFit: 90,
                experienceFit: 80,
                workFit: 90,
                skillPortability: 80,
                careerGrowth: 80,
                compensationFit: 100,
                locationFit: 100,
            },
        });

        expect(score).toBe(87);
    });

    it("returns zero when a hard constraint fails", () => {
        const score = calculator.calculate({
            eligibility: {
                passesHardConstraints: false,
                reasons: ["Location is not acceptable"],
            },
            scores: {
                currentSkillFit: 100,
                experienceFit: 100,
                workFit: 100,
                skillPortability: 100,
                careerGrowth: 100,
                compensationFit: 100,
                locationFit: 100,
            },
        });

        expect(score).toBe(0);
    });

    it("returns the same score when every category has the same score", () => {
        const score = calculator.calculate({
            eligibility: {
                passesHardConstraints: true,
                reasons: [],
            },
            scores: {
                currentSkillFit: 75,
                experienceFit: 75,
                workFit: 75,
                skillPortability: 75,
                careerGrowth: 75,
                compensationFit: 75,
                locationFit: 75,
            },
        });

        expect(score).toBe(75);
    });
});
