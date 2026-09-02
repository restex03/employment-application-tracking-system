import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../../../../../Domain/Candidates/ICandidateProfile";
import { PipelineStepStatus } from "../../../../../Pipelines/IPipelineStepResult";
import { IClassifiedJobRequirement } from "../../../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementMatch } from "../../../IJobRequirementMatch";
import { JobRequirementMatchMapper } from "../../../Mappers/JobRequirementMatchMapper";

import { MapRequirementMatch } from "./MapRequirementMatch";
import { IJobRequirementMatchingContext } from "../../IJobRequirementMatchingContext";

describe("MapRequirementMatch", () => {
    let mapper: JobRequirementMatchMapper;
    let step: MapRequirementMatch;

    const requirement: IClassifiedJobRequirement = {
        area: "Backend Development",
        description: "Experience developing backend services.",
        category: "technical_skill",
    };

    const profile = {
        currentTitle: "Software Engineer",
    } as ICandidateProfile;

    beforeEach(() => {
        mapper = {
            map: vi.fn(),
        } as unknown as JobRequirementMatchMapper;

        step = new MapRequirementMatch(mapper);
    });

    it("fails when the direct match assessment is missing", async () => {
        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Direct match assessment is missing.",
        });

        expect(mapper.map).not.toHaveBeenCalled();
    });

    it("fails when the direct match references a different context requirement", async () => {
        const differentRequirement: IClassifiedJobRequirement = {
            ...requirement,
        };

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement: differentRequirement,
                isDirectMatch: true,
                evidence: "Evidence.",
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Direct match requirement does not match context requirement.",
        });

        expect(mapper.map).not.toHaveBeenCalled();
    });

    it("maps and stores a direct match", async () => {
        const directMatch = {
            requirement,
            isDirectMatch: true,
            evidence: "Candidate explicitly satisfies the requirement.",
        };

        const match: IJobRequirementMatch = {
            requirement,
            matchType: "direct",
            evidence: "Candidate explicitly satisfies the requirement.",
        };

        vi.mocked(mapper.map).mockReturnValue(match);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(mapper.map).toHaveBeenCalledWith(directMatch, undefined);

        expect(context.match).toBe(match);
    });

    it("maps and stores a transferable match", async () => {
        const directMatch = {
            requirement,
            isDirectMatch: false,
            evidence: null,
        };

        const transferableMatch = {
            requirement,
            isTransferableMatch: true,
            evidence: "Candidate has closely related backend experience.",
        };

        const match: IJobRequirementMatch = {
            requirement,
            matchType: "transferable",
            evidence: "Candidate has closely related backend experience.",
        };

        vi.mocked(mapper.map).mockReturnValue(match);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch,
            transferableMatch,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(mapper.map).toHaveBeenCalledWith(directMatch, transferableMatch);

        expect(context.match).toBe(match);
    });

    it("maps and stores a missing match", async () => {
        const directMatch = {
            requirement,
            isDirectMatch: false,
            evidence: null,
        };

        const transferableMatch = {
            requirement,
            isTransferableMatch: false,
            evidence: null,
        };

        const match: IJobRequirementMatch = {
            requirement,
            matchType: "missing",
            evidence: null,
        };

        vi.mocked(mapper.map).mockReturnValue(match);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch,
            transferableMatch,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(mapper.map).toHaveBeenCalledWith(directMatch, transferableMatch);

        expect(context.match).toBe(match);
    });

    it("returns a failed result when the mapper throws an Error", async () => {
        vi.mocked(mapper.map).mockImplementation(() => {
            throw new Error("Mapping failed");
        });

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
            transferableMatch: {
                requirement,
                isTransferableMatch: false,
                evidence: null,
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Mapping failed",
        });

        expect(context.match).toBeUndefined();
    });

    it("converts a non-Error thrown value to a failure reason", async () => {
        vi.mocked(mapper.map).mockImplementation(() => {
            throw "Mapping failed";
        });

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
            transferableMatch: {
                requirement,
                isTransferableMatch: false,
                evidence: null,
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Mapping failed",
        });
    });
});
