import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { ILogger } from "../../../../Infrastructure/Logging/ILogger";
import { ILlmInferenceProvider } from "../../../../Infrastructure/Inference/ILlmInferenceProvider";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { JobRequirementTransferableMatchingService } from "./JobRequirementTransferableMatchingService";
import { JobRequirementTransferableMatchingSystemPrompt } from "./JobRequirementTransferableMatchingSystemPrompt";
import { JobRequirementTransferableMatchResponseSchema } from "./JobRequirementTransferableMatchResponseSchema";
import { JobRequirementTransferableMatchResponseValidationSchema } from "./JobRequirementTransferableMatchResponseValidationSchema";

describe("JobRequirementTransferableMatchingService", () => {
    let llm: ILlmInferenceProvider;
    let logger: ILogger;
    let service: JobRequirementTransferableMatchingService;

    const requirement: IClassifiedJobRequirement = {
        area: "Java / Spring Boot",
        description: "Experience developing backend services using Java and Spring Boot.",
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

        service = new JobRequirementTransferableMatchingService(llm, logger);
    });

    describe("transferable match", () => {
        it("returns a transferable match with evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: true,
                evidence: "Production backend development experience using C# and .NET.",
            });

            const result = await service.assess(requirement, profile);

            expect(result).toEqual({
                requirement,
                isTransferableMatch: true,
                evidence: "Production backend development experience using C# and .NET.",
            });
        });

        it("preserves the original requirement instance", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: true,
                evidence: "Production backend development experience using C# and .NET.",
            });

            const result = await service.assess(requirement, profile);

            expect(result.requirement).toBe(requirement);
        });

        it("throws when a transferable match has null evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: true,
                evidence: null,
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Transferable match requires evidence: Java / Spring Boot"
            );
        });

        it("throws when a transferable match has empty evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: true,
                evidence: "",
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Transferable match requires evidence: Java / Spring Boot"
            );
        });
    });

    describe("non-transferable match", () => {
        it("returns a non-transferable match with null evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: false,
                evidence: null,
            });

            const result = await service.assess(requirement, profile);

            expect(result).toEqual({
                requirement,
                isTransferableMatch: false,
                evidence: null,
            });
        });

        it("preserves the original requirement instance", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: false,
                evidence: null,
            });

            const result = await service.assess(requirement, profile);

            expect(result.requirement).toBe(requirement);
        });

        it("throws when a non-transferable match contains evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: false,
                evidence: "Related backend experience.",
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Non-transferable match must not contain evidence: Java / Spring Boot"
            );
        });

        it("throws when a non-transferable match contains empty-string evidence", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: false,
                evidence: "",
            });

            await expect(service.assess(requirement, profile)).rejects.toThrow(
                "Non-transferable match must not contain evidence: Java / Spring Boot"
            );
        });
    });

    describe("inference request", () => {
        it("sends the requirement and profile to the inference provider", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: false,
                evidence: null,
            });

            await service.assess(requirement, profile);

            expect(llm.generateStructured).toHaveBeenCalledOnce();

            expect(llm.generateStructured).toHaveBeenCalledWith({
                systemPrompt: JobRequirementTransferableMatchingSystemPrompt,
                input: {
                    requirement,
                    profile,
                },
                schemaName: "job_requirement_transferable_match",
                jsonSchema: JobRequirementTransferableMatchResponseSchema,
                validationSchema: JobRequirementTransferableMatchResponseValidationSchema,
                temperature: 0.1,
                maxTokens: 150,
            });
        });

        it("passes the original requirement and profile instances to the provider", async () => {
            vi.mocked(llm.generateStructured).mockResolvedValue({
                isTransferableMatch: false,
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
                isTransferableMatch: false,
                evidence: null,
            });

            await service.assess(requirement, profile);

            expect(logger.info).toHaveBeenCalledWith(
                "[JobRequirementTransferableMatchingService.assess] Assessing: Java / Spring Boot"
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
