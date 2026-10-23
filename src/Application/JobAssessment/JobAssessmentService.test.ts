import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRequirement } from "./RequirementsExtraction/JobRequirement";
import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { IJobAssessment } from "../../Domain/JobAssessment/IJobAssessment";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";
import { PipelineStepStatus } from "../Pipelines/IPipelineStepResult";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { JobAssessmentService } from "./JobAssessmentService";
import { IJobAssessmentContext } from "./Pipeline/IJobAssessmentContext";
import { IJobRequirementMatch } from "./RequirementMatching/IJobRequirementMatch";

describe("JobAssessmentService", () => {
    let candidateProfileRepo: IJobCandidateProfileRepository;
    let pipeline: PipelineRunner<IJobAssessmentContext>;
    let jobPostGateway: IJobPostGateway;
    let jobAssessmentRepo: IJobAssessmentRepository;
    let logger: ILogger;
    let service: JobAssessmentService;

    const candidateProfile = { id: "candidate-1" } as ICandidateProfile;
    const jobPost = {
        id: "job-1",
        sourceId: "source-1",
        title: "Senior Software Engineer",
        detailPath: "/job-1",
        jobLink: "https://acme.example.com/job-1",
        createdAt: new Date("2026-01-01"),
        hydrateDetail: vi.fn(),
    } satisfies IJobPost;

    const requirementMatch: IJobRequirementMatch = {
        requirement: new JobRequirement(["Java"], "single", "Java experience"),
        matchType: "direct",
        evidence: "Candidate has Java experience.",
    };

    beforeEach(() => {
        candidateProfileRepo = {
            getCandidateProfileByIdOrThrow: vi.fn().mockResolvedValue(candidateProfile),
        } as unknown as IJobCandidateProfileRepository;

        jobPostGateway = {
            getById: vi.fn().mockResolvedValue(jobPost),
            list: vi.fn(),
        };

        jobAssessmentRepo = {
            storeAssessment: vi.fn().mockImplementation(async (result: IJobAssessment) => result),
            getById: vi.fn(),
            getByIdOrThrow: vi.fn(),
            getLatestAssessment: vi.fn(),
            getLatestAssessmentOrThrow: vi.fn(),
            updateReviewStatus: vi.fn(),
        };

        logger = {
            table: vi.fn(),
            trace: vi.fn(),
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };

        pipeline = new PipelineRunner<IJobAssessmentContext>([]);
        vi.spyOn(pipeline, "run");

        service = new JobAssessmentService(
            candidateProfileRepo,
            pipeline,
            jobPostGateway,
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

    describe("getLatestAssessmentOrThrow", () => {
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

        it("throws before running the pipeline when the job post is not found", async () => {
            vi.mocked(jobPostGateway.getById).mockResolvedValue(undefined);

            await expect(service.runAssessment(candidateProfile.id, jobPost.id)).rejects.toThrow(
                `Job post with ID ${jobPost.id} not found.`
            );

            expect(jobPostGateway.getById).toHaveBeenCalledWith(jobPost.id);
            expect(candidateProfileRepo.getCandidateProfileByIdOrThrow).not.toHaveBeenCalled();
            expect(pipeline.run).not.toHaveBeenCalled();
            expect(jobAssessmentRepo.storeAssessment).not.toHaveBeenCalled();
        });

        it("marks the assessment incomplete when the job post is rejected during screening", async () => {
            vi.mocked(pipeline.run).mockImplementation(async context => {
                context.screenResult = { disposition: "reject", reason: "Not a fit", job: jobPost };
                return { status: PipelineStepStatus.Succeeded, context };
            });

            const result = await service.runAssessment(candidateProfile.id, jobPost.id);

            expect(jobPostGateway.getById).toHaveBeenCalledWith(jobPost.id);
            expect(result.status).toBe("incomplete");
            expect(jobAssessmentRepo.storeAssessment).toHaveBeenCalledWith(
                expect.objectContaining({ status: "incomplete" })
            );
        });

        it("throws when a pipeline step fails", async () => {
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

        });

        it("does not throw when the pipeline succeeds with no requirement matches", async () => {
            vi.mocked(pipeline.run).mockImplementation(async context => {
                return { status: PipelineStepStatus.Succeeded, context };
            });

            const result = await service.runAssessment(candidateProfile.id, jobPost.id);

            expect(result.status).toBe("complete");
            expect(jobAssessmentRepo.storeAssessment).toHaveBeenCalledWith(
                expect.objectContaining({ status: "complete", requirementMatches: [] })
            );
        });
    });
});
