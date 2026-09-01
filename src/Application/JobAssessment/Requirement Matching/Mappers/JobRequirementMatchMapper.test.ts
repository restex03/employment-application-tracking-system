import { describe, expect, it } from "vitest";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementMatchResponse } from "../IJobRequirementMatchResponse";
import { JobRequirementMatchMapper } from "./JobRequirementMatchMapper";

describe("JobRequirementMatchMapper", () => {
    const mapper = new JobRequirementMatchMapper();

    const requirements: IClassifiedJobRequirement[] = [
        {
            area: "Public Cloud Platform",
            description: "Experience with AWS, GCP, or Azure.",
            category: "technical_skill",
        },
        {
            area: "Java / Spring Boot",
            description: "Experience developing applications using Java and Spring Boot.",
            category: "technical_skill",
        },
    ];

    it("maps matches to requirements by index", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
            {
                index: 1,
                matchType: "transferable",
                evidence: "Production backend development experience with C# and .NET.",
            },
        ];

        const result = mapper.map(requirements, matches);

        expect(result).toEqual([
            {
                requirement: requirements[0],
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
            {
                requirement: requirements[1],
                matchType: "transferable",
                evidence: "Production backend development experience with C# and .NET.",
            },
        ]);
    });

    it("maps matches correctly when response order differs from requirement order", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 1,
                matchType: "transferable",
                evidence: "Production backend development experience with C# and .NET.",
            },
            {
                index: 0,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
        ];

        const result = mapper.map(requirements, matches);

        expect(result[0]).toEqual({
            requirement: requirements[0],
            matchType: "direct",
            evidence: "Production experience with AWS.",
        });

        expect(result[1]).toEqual({
            requirement: requirements[1],
            matchType: "transferable",
            evidence: "Production backend development experience with C# and .NET.",
        });
    });

    it("maps missing matches with null evidence", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "missing",
                evidence: null,
            },
            {
                index: 1,
                matchType: "missing",
                evidence: null,
            },
        ];

        const result = mapper.map(requirements, matches);

        expect(result).toEqual([
            {
                requirement: requirements[0],
                matchType: "missing",
                evidence: null,
            },
            {
                requirement: requirements[1],
                matchType: "missing",
                evidence: null,
            },
        ]);
    });

    it("returns an empty array when both requirements and matches are empty", () => {
        const result = mapper.map([], []);

        expect(result).toEqual([]);
    });

    it("throws when match count is less than requirement count", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Expected 2 requirement matches but received 1.");
    });

    it("throws when match count is greater than requirement count", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
            {
                index: 1,
                matchType: "transferable",
                evidence: "Production backend development experience with C# and .NET.",
            },
            {
                index: 2,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Expected 2 requirement matches but received 3.");
    });

    it("throws when a match index is negative", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: -1,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
            {
                index: 1,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Invalid requirement match index -1.");
    });

    it("throws when a match index exceeds the requirement range", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
            {
                index: 2,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Invalid requirement match index 2.");
    });

    it("throws when a match index is duplicated", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: "Production experience with AWS.",
            },
            {
                index: 0,
                matchType: "transferable",
                evidence: "Related cloud experience.",
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Duplicate requirement match index 0.");
    });

    it("throws when a direct match has null evidence", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: null,
            },
            {
                index: 1,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Missing evidence for direct match at index 0.");
    });

    it("throws when a direct match has empty evidence", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "direct",
                evidence: "",
            },
            {
                index: 1,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Missing evidence for direct match at index 0.");
    });

    it("throws when a transferable match has null evidence", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "transferable",
                evidence: null,
            },
            {
                index: 1,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Missing evidence for transferable match at index 0.");
    });

    it("throws when a missing match contains evidence", () => {
        const matches: IJobRequirementMatchResponse[] = [
            {
                index: 0,
                matchType: "missing",
                evidence: "Some unrelated candidate experience.",
            },
            {
                index: 1,
                matchType: "missing",
                evidence: null,
            },
        ];

        expect(() => mapper.map(requirements, matches)).toThrow("Unexpected evidence for missing match at index 0.");
    });
});
