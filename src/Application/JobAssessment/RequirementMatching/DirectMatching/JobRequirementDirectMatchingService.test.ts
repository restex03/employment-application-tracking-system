import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { ILogger } from "../../../../Infrastructure/Logging/ILogger";
import { ILlmInferenceProvider } from "../../../../Infrastructure/Inference/ILlmInferenceProvider";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { JobRequirementDirectMatchingService } from "./JobRequirementDirectMatchingService";
import { JobRequirementDirectMatchingSystemPrompt } from "./JobRequirementDirectMatchingSystemPrompt";
import { JobRequirementDirectMatchResponseSchema } from "./JobRequirementDirectMatchResponseSchema";
import { JobRequirementDirectMatchResponseValidationSchema } from "./JobRequirementDirectMatchResponseValidationSchema";

describe("JobRequirementDirectMatchingService", () => {
    let llm: ILlmInferenceProvider;
    let logger: ILogger;
    let service: JobRequirementDirectMatchingService;

    const requirement: IClassifiedJobRequirement = {
        area: "Public Cloud Platform",
        description: "Experience with cloud platforms: AWS, GCP, or Azure.",
        category: "technical_skill",
    };

    const profile = {
        currentTitle: "Software Engineer",
    } as ICandidateProfile;

    beforeEach(() => {
        llm = {
            generateStructured: vi.fn(),
        } as unknown as ILlmInferenceProvider;

        logger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as unknown as ILogger;

        service = new JobRequirementDirectMatchingService(llm, logger);
    });

    describe("direct match", () => {
        it("returns a direct match with evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: true,
                evidence: "Profile lists AWS with production experience.",
            });

            const result = await service.assess(requirement, profile);

            expect(result).toEqual({
                requirement,
                isDirectMatch: true,
                evidence: "Profile lists AWS with production experience.",
            });
        });

        it("preserves the original requirement instance", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: true,
                evidence: "Profile lists AWS with production experience.",
            });

            const result = await service.assess(requirement, profile);

            expect(result.requirement).toBe(requirement);
        });

        it("throws when a direct match has null evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: true,
                evidence: null,
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Direct match requires evidence: Public Cloud Platform"
            );
        });

        it("throws when a direct match has empty evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: true,
                evidence: "",
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Direct match requires evidence: Public Cloud Platform"
            );
        });
    });

    describe("non-direct match", () => {
        it("returns a non-direct match with null evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: null,
            });

            const result = await service.assess(requirement, profile);

            expect(result).toEqual({
                requirement,
                isDirectMatch: false,
                evidence: null,
            });
        });

        it("preserves the original requirement instance", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: null,
            });

            const result = await service.assess(requirement, profile);

            expect(result.requirement).toBe(requirement);
        });

        it("throws when a non-direct match contains evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: "Candidate has related AWS experience.",
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Non-direct match must not contain evidence: Public Cloud Platform"
            );
        });

        it("throws when a non-direct match contains empty-string evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: "",
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Non-direct match must not contain evidence: Public Cloud Platform"
            );
        });
    });

    describe("inference request", () => {
        it("sends the requirement and profile to the inference provider", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: null,
            });

            await service.assess(requirement, profile);

            expect(llm.generateStructured).toHaveBeenCalledOnce();

            expect(llm.generateStructured).toHaveBeenCalledWith({
                systemPrompt: JobRequirementDirectMatchingSystemPrompt,
                input: {
                    requirement,
                    profile,
                },
                schemaName: "job_requirement_direct_match",
                jsonSchema: JobRequirementDirectMatchResponseSchema,
                validationSchema: JobRequirementDirectMatchResponseValidationSchema,
                temperature: 0.1,
                maxTokens: 150,
            });
        });

        it("passes the original requirement and profile instances to the provider", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: null,
            });

            await service.assess(requirement, profile);

            const generateStructured = vi.mocked(llm.generateStructured);

            const request = generateStructured.mock.calls[0][0];

            const requestInput = request.input as {
                requirement: IClassifiedJobRequirement;
                profile: ICandidateProfile;
            };
            expect(requestInput.requirement).toBe(requirement);
            expect(requestInput.profile).toBe(profile);
        });
    });

    describe("logging", () => {
        it("logs the requirement being assessed", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isDirectMatch: false,
                evidence: null,
            });

            await service.assess(requirement, profile);

            expect(logger.info).toHaveBeenCalledWith(
                "[JobRequirementDirectMatchingService.assess] Assessing: Public Cloud Platform"
            );
        });
    });

    describe("provider failure", () => {
        it("propagates inference provider errors", async () => {
            const error = new Error("Inference failed");

            vi.mocked(llm.generateStructured).mockRejectedValue(error);

            await expect(service.assess(requirement, profile)).rejects.toBe(error);
        });
    });
});
