import { describe, expect, it } from "vitest";
import { IJobScore } from "../../../Evaluators/ScoreEvaluator/IJobMatchEvidence";
import { JobCompatibilityScoreCalculator } from "./JobCompatibilityScoreCalculator";

describe("JobCompatibilityScoreCalculator", () => {
    const calculator = new JobCompatibilityScoreCalculator();

    const createScores = (overrides: Partial<IJobScore> = {}): IJobScore => ({
        currentSkillFit: 80,
        experienceFit: 80,
        workFit: 80,
        skillPortability: 80,
        careerGrowth: 80,
        ...overrides,
    });

    it("calculates the weighted compatibility score", () => {
        const scores = createScores({
            currentSkillFit: 65,
            experienceFit: 85,
            workFit: 90,
            skillPortability: 90,
            careerGrowth: 90,
        });

        const result = calculator.calculate(scores);

        expect(result).toBe(81);
    });

    it("returns the same score when all dimensions are equal", () => {
        const scores = createScores({
            currentSkillFit: 85,
            experienceFit: 85,
            workFit: 85,
            skillPortability: 85,
            careerGrowth: 85,
        });

        expect(calculator.calculate(scores)).toBe(85);
    });

    it("returns 100 when all dimensions are 100", () => {
        const scores = createScores({
            currentSkillFit: 100,
            experienceFit: 100,
            workFit: 100,
            skillPortability: 100,
            careerGrowth: 100,
        });

        expect(calculator.calculate(scores)).toBe(100);
    });

    it("returns 0 when all dimensions are 0", () => {
        const scores = createScores({
            currentSkillFit: 0,
            experienceFit: 0,
            workFit: 0,
            skillPortability: 0,
            careerGrowth: 0,
        });

        expect(calculator.calculate(scores)).toBe(0);
    });

    it("applies higher weight to currentSkillFit than careerGrowth", () => {
        const highSkillFit = createScores({
            currentSkillFit: 100,
            careerGrowth: 0,
        });

        const highCareerGrowth = createScores({
            currentSkillFit: 0,
            careerGrowth: 100,
        });

        const highSkillFitResult = calculator.calculate(highSkillFit);
        const highCareerGrowthResult = calculator.calculate(highCareerGrowth);

        expect(highSkillFitResult).toBeGreaterThan(highCareerGrowthResult);
    });

    it("rounds the weighted result to the nearest integer", () => {
        const scores = createScores({
            currentSkillFit: 81,
            experienceFit: 80,
            workFit: 80,
            skillPortability: 80,
            careerGrowth: 80,
        });

        expect(calculator.calculate(scores)).toBe(80);
    });

    it("preserves the relative weighting after normalization", () => {
        const scores: IJobScore = {
            currentSkillFit: 100,
            experienceFit: 0,
            workFit: 0,
            skillPortability: 0,
            careerGrowth: 0,
        };

        const result = calculator.calculate(scores);

        expect(result).toBe(32);
    });
});
