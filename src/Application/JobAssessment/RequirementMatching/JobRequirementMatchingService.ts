import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatchingService } from "./DirectMatching/IJobRequirementDirectMatchingService";
import { JobRequirementsMatchingService } from "./JobRequirementsMatchingService";
import { JobRequirementMatchMapper } from "./Mappers/JobRequirementMatchMapper";
import { IJobRequirementTransferableMatchingService } from "./TransferableMatching/IJobRequirementTransferableMatchingService";

describe("JobRequirementsMatchingService", () => {
    let directMatchingService: IJobRequirementDirectMatchingService;
    let transferableMatchingService: IJobRequirementTransferableMatchingService;
    let logger: ILogger;
    let service: JobRequirementsMatchingService;

    const profile = {
        currentTitle: "Software Engineer",
    } as ICandidateProfile;

    const requirement: IClassifiedJobRequirement = {
        area: "Java / Spring Boot",
        description: "Experience developing backend services using Java and Spring Boot.",
        category: "technical_skill",
    };

    beforeEach(() => {
        directMatchingService = {
            assess: vi.fn(),
        };

        transferableMatchingService = {
            assess: vi.fn(),
        };

        logger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as unknown as ILogger;

        service = new JobRequirementsMatchingService(
            directMatchingService,
            transferableMatchingService,
            new JobRequirementMatchMapper(),
            logger
        );
    });

    it("returns direct and does not assess transferability when direct matching succeeds", async () => {
        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement,
            isDirectMatch: true,
            evidence: "Candidate explicitly has Java and Spring Boot experience.",
        });

        const result = await service.matchSingle(requirement, profile);

        expect(result).toEqual({
            requirement,
            matchType: "direct",
            evidence: "Candidate explicitly has Java and Spring Boot experience.",
        });

        expect(directMatchingService.assess).toHaveBeenCalledWith(requirement, profile);

        expect(transferableMatchingService.assess).not.toHaveBeenCalled();

        expect(result.requirement).toBe(requirement);
    });

    it("returns transferable when direct matching fails and transferability succeeds", async () => {
        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement,
            isDirectMatch: false,
            evidence: null,
        });

        vi.mocked(transferableMatchingService.assess).mockResolvedValue({
            requirement,
            isTransferableMatch: true,
            evidence: "Candidate has production backend experience using C# and .NET.",
        });

        const result = await service.matchSingle(requirement, profile);

        expect(result).toEqual({
            requirement,
            matchType: "transferable",
            evidence: "Candidate has production backend experience using C# and .NET.",
        });

        expect(directMatchingService.assess).toHaveBeenCalledOnce();

        expect(transferableMatchingService.assess).toHaveBeenCalledOnce();

        expect(transferableMatchingService.assess).toHaveBeenCalledWith(requirement, profile);
    });

    it("returns missing when neither direct nor transferable matching succeeds", async () => {
        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement,
            isDirectMatch: false,
            evidence: null,
        });

        vi.mocked(transferableMatchingService.assess).mockResolvedValue({
            requirement,
            isTransferableMatch: false,
            evidence: null,
        });

        const result = await service.matchSingle(requirement, profile);

        expect(result).toEqual({
            requirement,
            matchType: "missing",
            evidence: null,
        });
    });

    it("preserves requirement order when matching multiple requirements", async () => {
        const requirements: IClassifiedJobRequirement[] = [
            {
                area: "AWS",
                description: "Experience with AWS.",
                category: "technical_skill",
            },
            {
                area: "Java",
                description: "Experience with Java.",
                category: "technical_skill",
            },
            {
                area: "Ansible",
                description: "Experience with Ansible.",
                category: "technical_skill",
            },
        ];

        vi.mocked(directMatchingService.assess).mockImplementation(async requirement => {
            if (requirement.area === "AWS") {
                return {
                    requirement,
                    isDirectMatch: true,
                    evidence: "Explicit AWS experience.",
                };
            }

            return {
                requirement,
                isDirectMatch: false,
                evidence: null,
            };
        });

        vi.mocked(transferableMatchingService.assess).mockImplementation(async requirement => {
            if (requirement.area === "Java") {
                return {
                    requirement,
                    isTransferableMatch: true,
                    evidence: "Transferable .NET backend experience.",
                };
            }

            return {
                requirement,
                isTransferableMatch: false,
                evidence: null,
            };
        });

        const results = await service.match(requirements, profile);

        expect(results).toHaveLength(3);

        expect(results.map(x => x.requirement)).toEqual(requirements);

        expect(results[0].requirement).toBe(requirements[0]);

        expect(results[1].requirement).toBe(requirements[1]);

        expect(results[2].requirement).toBe(requirements[2]);

        expect(results.map(x => x.matchType)).toEqual(["direct", "transferable", "missing"]);
    });

    it("stops the nested pipeline when direct matching fails", async () => {
        vi.mocked(directMatchingService.assess).mockRejectedValue(new Error("Direct inference failed"));

        await expect(service.matchSingle(requirement, profile)).rejects.toThrow(/Direct inference failed/);

        expect(transferableMatchingService.assess).not.toHaveBeenCalled();
    });

    it("fails when the direct matching service returns a different requirement instance", async () => {
        const differentRequirement: IClassifiedJobRequirement = {
            ...requirement,
        };

        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement: differentRequirement,
            isDirectMatch: true,
            evidence: "Evidence.",
        });

        await expect(service.matchSingle(requirement, profile)).rejects.toThrow(
            /Direct match requirement does not match context requirement/
        );
    });

    it("fails when the transferable matching service returns a different requirement instance", async () => {
        const differentRequirement: IClassifiedJobRequirement = {
            ...requirement,
        };

        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement,
            isDirectMatch: false,
            evidence: null,
        });

        vi.mocked(transferableMatchingService.assess).mockResolvedValue({
            requirement: differentRequirement,
            isTransferableMatch: true,
            evidence: "Evidence.",
        });

        await expect(service.matchSingle(requirement, profile)).rejects.toThrow(
            /Transferable match requirement does not match context requirement/
        );
    });

    it("logs the start and completion of matching multiple requirements", async () => {
        vi.mocked(directMatchingService.assess).mockResolvedValue({
            requirement,
            isDirectMatch: true,
            evidence: "Direct evidence.",
        });

        await service.match([requirement], profile);

        expect(logger.info).toHaveBeenCalledWith("[JobRequirementsMatchingService.match] Matching 1 requirements");

        expect(logger.info).toHaveBeenCalledWith(
            "[JobRequirementsMatchingService.match] Completed matching 1 requirements"
        );
    });
});
