import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../../../../Domain/Candidates/ICandidateProfile";
import { IClassifiedJobRequirement } from "../../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementTransferableMatchingService } from "../../TransferableMatching/IJobRequirementTransferableMatchingService";
import { PipelineStepStatus } from "../../../../Pipelines/IPipelineStepResult";
import { AssessTransferableMatch } from "./AssessTransferableMatch";
import { IJobRequirementMatchingContext } from "./IJobRequirementMatchingContext";

describe("AssessTransferableMatch", () => {
    let transferableMatchingService: IJobRequirementTransferableMatchingService;
    let step: AssessTransferableMatch;

    const requirement: IClassifiedJobRequirement = {
        area: "Java / Spring Boot",
        description: "Experience developing backend services using Java and Spring Boot.",
        category: "technical_skill",
    };

    const profile = {
        currentTitle: "Software Engineer",
    } as ICandidateProfile;

    beforeEach(() => {
        transferableMatchingService = {
            assess: vi.fn(),
        };

        step = new AssessTransferableMatch(transferableMatchingService);
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

        expect(transferableMatchingService.assess).not.toHaveBeenCalled();

        expect(context.transferableMatch).toBeUndefined();
    });

    it("succeeds without assessing transferability when the requirement is a direct match", async () => {
        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: true,
                evidence: "Profile explicitly satisfies the requirement.",
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(transferableMatchingService.assess).not.toHaveBeenCalled();

        expect(context.transferableMatch).toBeUndefined();
    });

    it("assesses transferability when the requirement is not a direct match", async () => {
        const transferableMatch = {
            requirement,
            isTransferableMatch: true,
            evidence: "Production backend development experience using C# and .NET.",
        };

        vi.mocked(transferableMatchingService.assess).mockResolvedValue(transferableMatch);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(transferableMatchingService.assess).toHaveBeenCalledOnce();

        expect(transferableMatchingService.assess).toHaveBeenCalledWith(requirement, profile);

        expect(context.transferableMatch).toBe(transferableMatch);
    });

    it("stores a non-transferable assessment in the context", async () => {
        const transferableMatch = {
            requirement,
            isTransferableMatch: false,
            evidence: null,
        };

        vi.mocked(transferableMatchingService.assess).mockResolvedValue(transferableMatch);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(context.transferableMatch).toBe(transferableMatch);
    });

    it("passes the original requirement and profile instances to the service", async () => {
        vi.mocked(transferableMatchingService.assess).mockResolvedValue({
            requirement,
            isTransferableMatch: false,
            evidence: null,
        });

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
        };

        await step.execute(context);

        const assess = vi.mocked(transferableMatchingService.assess);

        const [actualRequirement, actualProfile] = assess.mock.calls[0];

        expect(actualRequirement).toBe(requirement);
        expect(actualProfile).toBe(profile);
    });

    it("returns a failed result when the transferable matching service throws an Error", async () => {
        vi.mocked(transferableMatchingService.assess).mockRejectedValue(new Error("Transferability inference failed"));

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Transferability inference failed",
        });

        expect(context.transferableMatch).toBeUndefined();
    });

    it("converts a non-Error thrown value to a failure reason", async () => {
        vi.mocked(transferableMatchingService.assess).mockRejectedValue("Transferability inference failed");

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
            directMatch: {
                requirement,
                isDirectMatch: false,
                evidence: null,
            },
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Transferability inference failed",
        });

        expect(context.transferableMatch).toBeUndefined();
    });
});
