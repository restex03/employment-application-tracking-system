import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../../../../../Domain/Candidates/ICandidateProfile";
import { PipelineStepStatus } from "../../../../../Pipelines/IPipelineStepResult";
import { IClassifiedJobRequirement } from "../../../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatchingService } from "../../../DirectMatching/IJobRequirementDirectMatchingService";
import { AssessDirectMatch } from "./AssessDirectMatch";
import { IJobRequirementMatchingContext } from "../../IJobRequirementMatchingContext";

describe("AssessDirectMatch", () => {
    let directMatchingService: IJobRequirementDirectMatchingService;
    let step: AssessDirectMatch;

    const requirement: IClassifiedJobRequirement = {
        area: "Public Cloud Platform",
        description: "Experience with AWS, GCP, or Azure.",
        category: "technical_skill",
    };

    const profile = {
        currentTitle: "Software Engineer",
    } as ICandidateProfile;

    beforeEach(() => {
        directMatchingService = {
            assess: vi.fn(),
        };

        step = new AssessDirectMatch(directMatchingService);
    });

    it("assesses the requirement and stores the direct match in context", async () => {
        const directMatch = {
            requirement,
            isDirectMatch: true,
            evidence: "Candidate has explicit AWS experience.",
        };

        vi.mocked(directMatchingService.assess).mockResolvedValue(directMatch);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(directMatchingService.assess).toHaveBeenCalledOnce();

        expect(directMatchingService.assess).toHaveBeenCalledWith(requirement, profile);

        expect(context.directMatch).toBe(directMatch);
    });

    it("stores a non-direct match in context", async () => {
        const directMatch = {
            requirement,
            isDirectMatch: false,
            evidence: null,
        };

        vi.mocked(directMatchingService.assess).mockResolvedValue(directMatch);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Succeeded,
        });

        expect(context.directMatch).toBe(directMatch);
    });

    it("passes the original requirement and profile instances to the service", async () => {
        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement,
            isDirectMatch: false,
            evidence: null,
        });

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        await step.execute(context);

        const assess = vi.mocked(directMatchingService.assess);

        const [actualRequirement, actualProfile] = assess.mock.calls[0];

        expect(actualRequirement).toBe(requirement);

        expect(actualProfile).toBe(profile);
    });

    it("fails when the service returns a different requirement instance", async () => {
        const differentRequirement: IClassifiedJobRequirement = {
            ...requirement,
        };

        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement: differentRequirement,
            isDirectMatch: true,
            evidence: "Candidate has explicit AWS experience.",
        });

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Direct match requirement does not match context requirement.",
        });

        expect(context.directMatch).toBeUndefined();
    });

    it("returns a failed result when the direct matching service throws an Error", async () => {
        vi.mocked(directMatchingService.assess).mockRejectedValue(new Error("Direct inference failed"));

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Direct inference failed",
        });

        expect(context.directMatch).toBeUndefined();
    });

    it("converts a non-Error thrown value to a failure reason", async () => {
        vi.mocked(directMatchingService.assess).mockRejectedValue("Direct inference failed");

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await step.execute(context);

        expect(result).toEqual({
            status: PipelineStepStatus.Failed,
            reason: "Direct inference failed",
        });
    });
});
