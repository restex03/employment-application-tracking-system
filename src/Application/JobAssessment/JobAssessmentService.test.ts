import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { IJobAssessment } from "../../Domain/JobAssessment/IJobAssessment";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobSource } from "../../Domain/JobSources/IJobSource";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { PipelineStepStatus } from "../Pipelines/IPipelineStepResult";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { JobAssessmentService } from "./JobAssessmentService";
import { IJobAssessmentContext } from "./Pipeline/IJobAssessmentContext";
import { IJobRequirementMatch } from "./RequirementMatching/IJobRequirementMatch";

describe("JobAssessmentService", () => {
    let candidateProfileRepo: IJobCandidateProfileRepository;
    let pipeline: PipelineRunner<IJobAssessmentContext>;
    let jobSourceRepository: IJobSourceRepository;
    let jobPostRepo: IJobPostRepository;
    let jobAssessmentRepo: IJobAssessmentRepository;
    let logger: ILogger;
    let service: JobAssessmentService;

    const candidateProfile = { id: "candidate-1" } as ICandidateProfile;
    const jobSource = {
        id: "source-1",
        companyName: "Acme",
        baseUrl: "https://acme.example.com",
        browserBaseUrl: "https://acme.example.com",
    } as IJobSource;
    const jobPost = {
        id: "job-1",
        sourceId: "source-1",
        title: "Senior Software Engineer",
        detailPath: "/job-1",
        createdAt: new Date("2026-01-01"),
        hydrateDetail: vi.fn(),
    } as IJobPost;

    const requirementMatch: IJobRequirementMatch = {
        requirement: { area: "Java", description: "Java experience", category: "technical_skill" },
        matchType: "direct",
        evidence: "Candidate has Java experience.",
    };

    beforeEach(() => {
        candidateProfileRepo = {
            getCandidateProfileByIdOrThrow: vi.fn().mockResolvedValue(candidateProfile),
        } as unknown as IJobCandidateProfileRepository;

        jobSourceRepository = {
            getByIdOrThrow: vi.fn().mockResolvedValue(jobSource),
        } as unknown as IJobSourceRepository;

        jobPostRepo = {
            getByIdOrThrow: vi.fn().mockResolvedValue(jobPost),
            update: vi.fn().mockResolvedValue(undefined),
        } as unknown as IJobPostRepository;

        jobAssessmentRepo = {
            storeAssessment: vi.fn().mockImplementation(async (result: IJobAssessment) => result),
            getById: vi.fn(),
            getByIdOrThrow: vi.fn(),
            getByJobPostAndCandidateId: vi.fn(),
            getLatestAssessmentOrThrow: vi.fn(),
        } as unknown as IJobAssessmentRepository;

        logger = {
            table: vi.fn(),
            trace: vi.fn(),
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as unknown as ILogger;

        pipeline = { run: vi.fn() } as unknown as PipelineRunner<IJobAssessmentContext>;

        service = new JobAssessmentService(
            candidateProfileRepo,
            pipeline,
            jobSourceRepository,
            jobPostRepo,
            jobAssessmentRepo,
            logger
        );
    });

    describe("getAssessmentByIdOrThrow", () => {
        it("delegates to the repository and maps the result to a response", async () => {
            const stored = {
                id: "assessment-1",
                candidateProfileId: candidateProfile.id,
                jobPostId: jobPost.id,
                createdAt: new Date("2026-01-02"),
                status: "complete",
                reviewStatus: "unreviewed",
                requirementMatches: [requirementMatch],
            } as unknown as IJobAssessment;

            vi.mocked(jobAssessmentRepo.getByIdOrThrow).mockResolvedValue(stored);

            const result = await service.getAssessmentByIdOrThrow("assessment-1");

            expect(jobAssessmentRepo.getByIdOrThrow).toHaveBeenCalledWith("assessment-1");
            expect(result).toMatchObject({
                id: "assessment-1",
                candidateProfileId: candidateProfile.id,
                jobPostId: jobPost.id,
                status: "complete",
            });
        });
    });

    describe("getAssessmentOrThrow", () => {
        it("delegates to the repository using the job post and candidate ids", async () => {
            const stored = {
                id: "assessment-2",
                candidateProfileId: candidateProfile.id,
                jobPostId: jobPost.id,
                createdAt: new Date("2026-01-02"),
                status: "complete",
                reviewStatus: "unreviewed",
                requirementMatches: [requirementMatch],
            } as unknown as IJobAssessment;

            vi.mocked(jobAssessmentRepo.getLatestAssessmentOrThrow).mockResolvedValue(stored);

            const result = await service.getLatestAssessmentOrThrow(jobPost.id, candidateProfile.id);

            expect(jobAssessmentRepo.getLatestAssessmentOrThrow).toHaveBeenCalledWith(jobPost.id, candidateProfile.id);
            expect(result.id).toBe("assessment-2");
        });
    });

    describe("runAssessment", () => {
        it("persists a complete assessment and hydrates the job post when the pipeline succeeds", async () => {
            vi.mocked(pipeline.run).mockImplementation(async context => {
                context.requirementMatches = [requirementMatch];
                return { status: PipelineStepStatus.Succeeded, context };
            });

            const result = await service.runAssessment(candidateProfile.id, jobPost.id);

            expect(result.status).toBe("complete");
            expect(jobAssessmentRepo.storeAssessment).toHaveBeenCalledWith(
                expect.objectContaining({
                    candidateProfileId: candidateProfile.id,
                    jobPostId: jobPost.id,
                    status: "complete",
                    requirementMatches: [requirementMatch],
                })
            );
            expect(jobPostRepo.update).toHaveBeenCalledWith(jobPost);
        });

        it("marks the assessment incomplete when the job post is rejected during screening", async () => {
            vi.mocked(pipeline.run).mockImplementation(async context => {
                context.screenResult = { disposition: "reject", reason: "Not a fit", job: jobPost };
                return { status: PipelineStepStatus.Succeeded, context };
            });

            const result = await service.runAssessment(candidateProfile.id, jobPost.id);

            expect(result.status).toBe("incomplete");
            expect(jobAssessmentRepo.storeAssessment).toHaveBeenCalledWith(
                expect.objectContaining({ status: "incomplete" })
            );
        });

        it("throws and does not persist anything when a pipeline step fails", async () => {
            vi.mocked(pipeline.run).mockResolvedValue({
                status: PipelineStepStatus.Failed,
                context: {} as IJobAssessmentContext,
                lastStepReached: "ScreenJob",
                reason: "screening blew up",
            });

            await expect(service.runAssessment(candidateProfile.id, jobPost.id)).rejects.toThrow(
                "Job assessment failed at ScreenJob: screening blew up"
            );

            expect(jobAssessmentRepo.storeAssessment).not.toHaveBeenCalled();
            expect(jobPostRepo.update).not.toHaveBeenCalled();
        });

        it("does not throw when the pipeline succeeds with no requirement matches", async () => {
            vi.mocked(pipeline.run).mockImplementation(async context => {
                return { status: PipelineStepStatus.Succeeded, context };
            });

            await expect(service.runAssessment(candidateProfile.id, jobPost.id)).resolves.not.toThrow();

            expect(jobAssessmentRepo.storeAssessment).toHaveBeenCalledWith(
                expect.objectContaining({ requirementMatches: [] })
            );
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("No requirement matches to report."));
        });
    });
});
