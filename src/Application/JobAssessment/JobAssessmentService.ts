import { IJobAssessmentResponse } from "../../Api/Contracts/JobAssessment/IJobAssessmentResponse";
import { IJobAssessment, JobAssessment, JobAssessmentStatus } from "../../Domain/JobAssessment/IJobAssessment";
import { JobAssessmentReviewStatus } from "../../Domain/JobAssessment/IJobAssessment";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { PipelineStepStatus } from "../Pipelines/IPipelineStepResult";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { IJobAssessmentResult } from "./IJobAssessmentResult";
import { IJobAssessmentService } from "./IJobAssessmentService";
import { JobAssessmentContext, IJobAssessmentContext } from "./Pipeline/IJobAssessmentContext";
import { randomUUID } from "crypto";
import { JobScreenDisposition } from "./Screening/IJobScreenResult";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";

export class JobAssessmentService implements IJobAssessmentService {
    constructor(
        private readonly candidateProfileRepo: IJobCandidateProfileRepository,
        private readonly pipeline: PipelineRunner<IJobAssessmentContext>,
        private readonly jobPostGateway: IJobPostGateway,
        private readonly jobAssessmentRepo: IJobAssessmentRepository,
        private readonly logger: ILogger
    ) {}

    public async getAssessmentByIdOrThrow(id: string): Promise<IJobAssessmentResponse> {
        const result = await this.jobAssessmentRepo.getByIdOrThrow(id);
        return mapToResponse(result);
    }

    public async getLatestAssessmentOrThrow(
        jobPostId: string,
        candidateProfileId: string
    ): Promise<IJobAssessmentResponse> {
        const result = await this.jobAssessmentRepo.getLatestAssessmentOrThrow(jobPostId, candidateProfileId);
        return mapToResponse(result);
    }

    public async updateReviewStatus(
        jobPostId: string,
        candidateProfileId: string,
        reviewStatus: JobAssessmentReviewStatus
    ): Promise<void> {
        this.logger.info(
            `[JobAssessmentService.updateReviewStatus] Updating review status for job post: ${jobPostId}, candidate: ${candidateProfileId}`
        );
        const assessment = await this.jobAssessmentRepo.getLatestAssessmentOrThrow(jobPostId, candidateProfileId);
        await this.jobAssessmentRepo.updateReviewStatus(assessment.id, reviewStatus);
    }


    private mapPipelineResultToDomain(result: IJobAssessmentResult): IJobAssessment {
        return new JobAssessment({
            id: randomUUID(),
            candidateProfileId: result.candidateProfile.id,
            jobPostId: result.job.id,

            status: result.status,
            reviewStatus: "unreviewed",

            screenResult: result.screenResult,
            requirements: result.requirements ?? [],
            requirementMatches: result.requirementMatches ?? [],
            jobMatchScore: result.jobMatchScore,

            createdAt: new Date(),
        });
    }

    /**
     * Runs a complete assessment pipeline for a given candidate profile and job post.
     */
    public async runAssessment(candidateProfileId: string, jobPostId: string): Promise<IJobAssessmentResult> {
        this.logger.info(`[JobAssessmentService.runAssessment] Running assessment for job post: ${jobPostId}`);

        const jobPost = await this.getJobPostOrThrow(jobPostId);


        const candidateProfile = await this.candidateProfileRepo.getCandidateProfileByIdOrThrow(candidateProfileId);

        const context = new JobAssessmentContext(candidateProfile, jobPost);

        const pipelineResult = await this.pipeline.run(context);

        if (pipelineResult.status === PipelineStepStatus.Failed) {
            this.logger.error(`Pipeline failure detected at step ${pipelineResult.lastStepReached}`);
            this.logger.error(`\t- Reason: ${pipelineResult.reason}`);

            throw new Error(
                `Job assessment failed${pipelineResult.lastStepReached ? ` at ${pipelineResult.lastStepReached}` : ""}: ${
                    pipelineResult.reason ?? "Unknown pipeline failure."
                }`
            );
        }

        const assessmentResult = this.createAssessmentResult(context, pipelineResult.status);
        
        const mapped = this.mapPipelineResultToDomain(assessmentResult);
        await this.jobAssessmentRepo.storeAssessment(mapped);

        this.logger.info("Assessment completed successfully.");

        return assessmentResult;
    }

    private createAssessmentResult(context: IJobAssessmentContext, status: PipelineStepStatus): IJobAssessmentResult {
        return {
            // status: status === PipelineStepStatus.Succeeded ? "complete" : "incomplete",
            status: this.getAssessmentStatus(context.screenResult?.disposition, status),
            candidateProfile: context.candidateProfile,
            job: context.job,
            screenResult: context.screenResult,
            requirements: context.requirements,
            requirementMatches: context.requirementMatches,
            jobMatchScore: context.jobMatchScore,
        };
    }
    private getAssessmentStatus(
        disposition: JobScreenDisposition | undefined,
        status: PipelineStepStatus
    ): JobAssessmentStatus {
        if (disposition === "reject") {
            return "incomplete";
        }
        if (status === PipelineStepStatus.Failed) {
            return "incomplete";
        }
        if (status === PipelineStepStatus.Succeeded) {
            return "complete";
        }
        this.logger.warn(`[JobAssessmentService] Assessment unknown due to unknown status or disposition.`);
        return "unknown";
    }
    private async getJobPostOrThrow(jobPostId: string): Promise<IJobPost> {
        const jobPost = await this.jobPostGateway.getById(jobPostId);
        if (!jobPost) {
            throw new Error(`Job post with ID ${jobPostId} not found.`);
        }
        return jobPost;
    }
    

    
}
function mapToResponse(result: IJobAssessment): IJobAssessmentResponse {
    return {
        id: result.id,
        candidateProfileId: result.candidateProfileId,
        jobPostId: result.jobPostId,
        createdAt: result.createdAt,
        status: result.status,
        reviewStatus: result.reviewStatus,
        screenResult: result.screenResult,
        requirementMatches: [...result.requirementMatches],
        jobMatchScore: result.jobMatchScore,
    };
}


