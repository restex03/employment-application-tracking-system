import { IJobAssessment, JobAssessment } from "../../Domain/JobAssessment/IJobAssessment";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { PipelineStepStatus } from "../Pipelines/IPipelineStepResult";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { IJobAssessmentResult } from "./IJobAssessmentResult";
import { IJobAssessmentService } from "./IJobAssessmentService";
import { JobAssessmentContext, IJobAssessmentContext } from "./Pipeline/IJobAssessmentContext";
import { IJobRequirementMatch } from "./RequirementMatching/IJobRequirementMatch";
import { randomUUID } from "crypto";

export type AssessmentStatus = "complete" | "incomplete";
export class JobAssessmentService implements IJobAssessmentService {
    constructor(
        private readonly candidateProfileRepo: IJobCandidateProfileRepository,
        private readonly pipeline: PipelineRunner<IJobAssessmentContext>,
        private readonly jobSourceRepository: IJobSourceRepository,
        private readonly jobPostRepo: IJobPostRepository,
        private readonly jobAssessmentRepo: IJobAssessmentRepository,
        private readonly logger: ILogger
    ) {}
    public async getAssessment(id: string): Promise<IJobAssessment> {
        const result = await this.jobAssessmentRepo.getByIdOrThrow(id);
        return result;
    }
    private async updateDatabase(result: IJobAssessmentResult): Promise<void> {
        const mapped = this.mapPipelineResultToDomain(result);
        const assessmentResult = await this.jobAssessmentRepo.storeAssessment(mapped);

        // hydrate job detail
        await this.jobPostRepo.update(result.job);
    }

    private mapPipelineResultToDomain(result: IJobAssessmentResult): IJobAssessment {
        return new JobAssessment({
            id: randomUUID(),
            candidateProfileId: result.candidateProfile.id,
            jobPostId: result.job.id,

            status: "complete",
            reviewStatus: "unreviewed",

            screenResult: result.screenResult,
            requirements: result.classifiedRequirements ?? [],
            requirementMatches: result.requirementMatches ?? [],
            jobMatchScore: result.jobMatchScore,

            createdAt: new Date(),
        });
    }

    /**
     * Runs a complete assessment pipeline for a given candidate profile and job post.
     *
     * TODO: Refactor to separate concerns:
     * - Job detail fetching should be decoupled from assessment execution
     * - Job post updates should be handled as a separate side effect, not inline
     */
    public async runAssessment(candidateProfileId: string, jobPostId: string): Promise<IJobAssessmentResult> {
        this.logger.info(`[JobAssessmentService.runAssessment] Running assessment for job post: ${jobPostId}`);

        const jobPost = await this.jobPostRepo.getByIdOrThrow(jobPostId);

        const jobSource = await this.jobSourceRepository.getByIdOrThrow(jobPost.sourceId);

        const candidateProfile = await this.candidateProfileRepo.getCandidateProfileByIdOrThrow(candidateProfileId);

        const context = new JobAssessmentContext(candidateProfile, jobPost, jobSource);

        const pipelineResult = await this.pipeline.run(context);

        if (pipelineResult.status === PipelineStepStatus.Failed) {
            this.logger.error(`Pipeline failure detected at step ${pipelineResult.failedStep}`);
            this.logger.error(`\t- Reason: ${pipelineResult.reason}`);

            throw new Error(
                `Job assessment failed${pipelineResult.failedStep ? ` at ${pipelineResult.failedStep}` : ""}: ${
                    pipelineResult.reason ?? "Unknown pipeline failure."
                }`
            );
        }

        const assessmentResult = this.createAssessmentResult(context, pipelineResult.status);
        await this.updateDatabase(assessmentResult);
        if (pipelineResult.status === PipelineStepStatus.Stopped) {
            this.logger.info("Assessment stopped successfully.");
        } else {
            this.logger.info("Assessment completed successfully.");

            this.printJobAssessmentDetails(context);
        }

        return assessmentResult;
    }

    private createAssessmentResult(context: IJobAssessmentContext, status: PipelineStepStatus): IJobAssessmentResult {
        return {
            status: status === PipelineStepStatus.Succeeded ? "complete" : "incomplete",
            jobSource: context.jobSource,
            candidateProfile: context.candidateProfile,
            job: context.job,
            screenResult: context.screenResult,
            requirements: context.requirements,
            classifiedRequirements: context.classifiedRequirements,
            requirementMatches: context.requirementMatches,
            jobMatchScore: context.jobMatchScore,
        };
    }

    private truncate(value: string | null | undefined, maxLength = 120): string {
        if (!value) {
            return "-";
        }

        return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
    }

    private printJobAssessmentDetails(context: IJobAssessmentContext): void {
        const reqId = context.jobDetail?.requisitionId ?? "Unknown";

        const title = context.job.title;
        const postedDate = context.job.postedDaysAgo;

        const locations =
            context.jobDetail?.locations
                ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
                .join("\n") ?? "\t- None";

        this.logger.info(`${reqId} - ${postedDate} ${title}`);

        this.logger.info(`\t- Requisition ID: ${context.jobDetail?.requisitionId ?? "Unknown"}`);

        this.logger.info(`\t- Locations (${context.jobDetail?.locations?.length ?? 0}):\n${locations}`);

        this.logger.info(`\t- Description: ${context.jobDetail?.description?.slice(0, 150) ?? "Unknown"}...\n`);

        if (context.jobMatchScore) {
            this.logger.info(`\t- Match Score: ${context.jobMatchScore.score}`);
        }

        this.printRequirementMatches(context.requirementMatches ?? []);
    }

    private printRequirementMatches(matches: IJobRequirementMatch[]): void {
        this.logger.info("\nRequirement Analysis");

        if (matches.length === 0) {
            throw new Error("Expected RequirementMatches, but received empty array.");
        }

        this.logger.table(
            matches.map((match, index) => ({
                "#": index + 1,
                Requirement: match.requirement.area,
                Category: match.requirement.category,
                Match: match.matchType,
                Evidence: this.truncate(match.evidence, 100),
            }))
        );
    }
}
