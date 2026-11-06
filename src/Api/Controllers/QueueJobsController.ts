import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
import { z } from "zod";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobAssessmentQueueService } from "../../Application/JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { IIngestionServiceGateway } from "../../Infrastructure/Ingestion/IIngestionServiceGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { assessmentJobParamsSchema } from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("queue-jobs")
export class QueueJobsController {
    constructor(
        @Inject(TOKENS.jobAssessmentQueueService) private readonly assessmentQueue: IJobAssessmentQueueService,
        @Inject(TOKENS.ingestionGateway) private readonly ingestion: IIngestionServiceGateway,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Get("assessments")
    async getActiveAssessments() {
        const context = "[GET] /api/v1/queue-jobs/assessments";
        this.logger.info(context);
        try {
            return { jobs: await this.assessmentQueue.getActiveJobs() };
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to get job assessments", error);
        }
    }

    @Get("assessments/:queueJobId")
    async getAssessment(
        @Param({ schema: assessmentJobParamsSchema }) params: z.infer<typeof assessmentJobParamsSchema>
    ) {
        const context = `[GET] /api/v1/queue-jobs/assessments/${params.queueJobId}`;
        this.logger.info(context);
        try {
            return await this.assessmentQueue.getJobByIdOrThrow(params.queueJobId);
        } catch (error) {
            if (error instanceof NotFoundError || (error instanceof Error && error.message.includes("not found"))) {
                this.logger.warn(`${context} Job not found: ${error instanceof Error ? error.message : String(error)}`);
                throw new NotFoundException({ error: "Job not found." });
            }

            return throwInternalError(this.logger, context, "Failed to get job status", error);
        }
    }

    @Get("job-post-syncs")
    async getActiveSyncs() {
        const context = "[GET] /api/v1/queue-jobs/job-post-syncs";
        this.logger.info(context);
        try {
            return await this.ingestion.getActiveSyncTasks();
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to get job post sync jobs", error);
        }
    }
}
