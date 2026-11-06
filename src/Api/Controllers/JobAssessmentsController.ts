import { Body, Controller, Get, HttpCode, HttpStatus, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobAssessmentService } from "../../Application/JobAssessment/IJobAssessmentService";
import { IJobAssessmentQueueService } from "../../Application/JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { jobAssessmentParamsSchema, jobAssessmentReviewBodySchema } from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("job-post-assessments")
export class JobAssessmentsController {
    constructor(
        @Inject(TOKENS.jobAssessmentService) private readonly assessments: IJobAssessmentService,
        @Inject(TOKENS.jobAssessmentQueueService) private readonly queue: IJobAssessmentQueueService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Post(":jobPostId/:candidateProfileId")
    @HttpCode(HttpStatus.ACCEPTED)
    async enqueue(@Param({ schema: jobAssessmentParamsSchema }) params: z.infer<typeof jobAssessmentParamsSchema>) {
        const context = `[POST] /api/v1/job-post-assessments/${params.jobPostId}/${params.candidateProfileId}`;
        this.logger.info(context);
        try {
            const jobId = await this.queue.enqueue(params);
            return { jobId };
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to run job assessment", error);
        }
    }

    @Get(":jobPostId/:candidateProfileId")
    async getLatest(@Param({ schema: jobAssessmentParamsSchema }) params: z.infer<typeof jobAssessmentParamsSchema>) {
        const context = `[GET] /api/v1/job-post-assessments/${params.jobPostId}/${params.candidateProfileId}`;
        this.logger.info(context);
        try {
            return await this.assessments.getLatestAssessmentOrThrow(params.jobPostId, params.candidateProfileId);
        } catch (error) {
            if (error instanceof NotFoundError) {
                this.logger.error(`${context} Not found: ${error.message}`);
                throw new NotFoundException({ error: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to get assessment", error);
        }
    }

    @Post(":jobPostId/:candidateProfileId/review-status")
    @HttpCode(HttpStatus.OK)
    async updateReviewStatus(
        @Param({ schema: jobAssessmentParamsSchema }) params: z.infer<typeof jobAssessmentParamsSchema>,
        @Body({ schema: jobAssessmentReviewBodySchema }) body: z.infer<typeof jobAssessmentReviewBodySchema>
    ) {
        const context = `[POST] /api/v1/job-post-assessments/${params.jobPostId}/${params.candidateProfileId}/review-status`;
        this.logger.info(context);
        try {
            await this.assessments.updateReviewStatus(params.jobPostId, params.candidateProfileId, body.reviewStatus);
            return undefined;
        } catch (error) {
            if (error instanceof NotFoundError) {
                this.logger.error(`${context} Not found: ${error.message}`);
                throw new NotFoundException({ error: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to update review status", error);
        }
    }
}
