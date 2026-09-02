import { describe, expect, it } from "vitest";
import { JobRequirementMatchMapper } from "./JobRequirementMatchMapper";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatch } from "../DirectMatching/IJobRequirementDirectMatch";
import { IJobRequirementTransferableMatch } from "../TransferableMatching/IJobRequirementTransferableMatch";

describe("JobRequirementMatchMapper", () => {
    const mapper = new JobRequirementMatchMapper();

    const requirement: IClassifiedJobRequirement = {
        area: "Backend Development",
        description: "Experience developing backend services using Java and Spring Boot.",
        category: "technical_skill",
    };

    describe("direct match", () => {
        it("maps a direct match", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: true,
                evidence: "Production experience developing Java and Spring Boot services.",
            };

            const result = mapper.map(directMatch);

            expect(result).toEqual({
                requirement,
                matchType: "direct",
                evidence: "Production experience developing Java and Spring Boot services.",
            });
        });

        it("preserves the original requirement instance", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: true,
                evidence: "Production experience developing Java and Spring Boot services.",
            };

            const result = mapper.map(directMatch);

            expect(result.requirement).toBe(requirement);
        });

        it("does not require a transferability assessment for a direct match", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: true,
                evidence: "Production experience developing Java and Spring Boot services.",
            };

            expect(() => mapper.map(directMatch)).not.toThrow();
        });

        it("throws when a direct match has null evidence", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: true,
                evidence: null,
            };

            expect(() => mapper.map(directMatch)).toThrow("Direct match is missing evidence: Backend Development");
        });

        it("throws when a direct match has empty evidence", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: true,
                evidence: "",
            };

            expect(() => mapper.map(directMatch)).toThrow("Direct match is missing evidence: Backend Development");
        });
    });

    describe("non-direct match", () => {
        it("throws when a non-direct match contains evidence", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: "Unexpected evidence.",
            };

            expect(() => mapper.map(directMatch)).toThrow(
                "Non-direct match contains unexpected evidence: Backend Development"
            );
        });

        it("throws when transferability assessment is missing", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            expect(() => mapper.map(directMatch)).toThrow("Transferability assessment is missing: Backend Development");
        });

        it("throws when direct and transferable assessments reference different requirements", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const differentRequirement: IClassifiedJobRequirement = {
                area: requirement.area,
                description: requirement.description,
                category: requirement.category,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement: differentRequirement,
                isTransferableMatch: true,
                evidence: "Production backend development experience using C# and .NET.",
            };

            expect(() => mapper.map(directMatch, transferableMatch)).toThrow(
                "Requirement mismatch between direct and transferable assessments: Backend Development"
            );
        });
    });

    describe("transferable match", () => {
        it("maps a transferable match", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: true,
                evidence: "Production backend development experience using C# and .NET.",
            };

            const result = mapper.map(directMatch, transferableMatch);

            expect(result).toEqual({
                requirement,
                matchType: "transferable",
                evidence: "Production backend development experience using C# and .NET.",
            });
        });

        it("preserves the original requirement instance", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: true,
                evidence: "Production backend development experience using C# and .NET.",
            };

            const result = mapper.map(directMatch, transferableMatch);

            expect(result.requirement).toBe(requirement);
            expect(transferableMatch.requirement).toBe(requirement);
        });

        it("throws when a transferable match has null evidence", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: true,
                evidence: null,
            };

            expect(() => mapper.map(directMatch, transferableMatch)).toThrow(
                "Transferable match is missing evidence: Backend Development"
            );
        });

        it("throws when a transferable match has empty evidence", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: true,
                evidence: "",
            };

            expect(() => mapper.map(directMatch, transferableMatch)).toThrow(
                "Transferable match is missing evidence: Backend Development"
            );
        });
    });

    describe("missing match", () => {
        it("maps a non-transferable requirement to missing", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: false,
                evidence: null,
            };

            const result = mapper.map(directMatch, transferableMatch);

            expect(result).toEqual({
                requirement,
                matchType: "missing",
                evidence: null,
            });
        });

        it("preserves the original requirement instance for a missing match", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: false,
                evidence: null,
            };

            const result = mapper.map(directMatch, transferableMatch);

            expect(result.requirement).toBe(requirement);
        });

        it("throws when a non-transferable match contains evidence", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement,
                isTransferableMatch: false,
                evidence: "Unexpected evidence.",
            };

            expect(() => mapper.map(directMatch, transferableMatch)).toThrow(
                "Non-transferable match contains unexpected evidence: Backend Development"
            );
        });

        it("throws when a non-transferable assessment references a different requirement", () => {
            const directMatch: IJobRequirementDirectMatch = {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };

            const differentRequirement: IClassifiedJobRequirement = {
                area: "Cloud Platform",
                description: "Experience with AWS.",
                category: "technical_skill",
            };

            const transferableMatch: IJobRequirementTransferableMatch = {
                requirement: differentRequirement,
                isTransferableMatch: false,
                evidence: null,
            };

            expect(() => mapper.map(directMatch, transferableMatch)).toThrow(
                "Requirement mismatch between direct and transferable assessments: Backend Development"
            );
        });
    });
});
