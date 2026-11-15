import { Body, Controller, Get, HttpCode, HttpStatus, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobApplicationService } from "../../Application/JobApplications/IJobApplicationService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import {
    jobApplicationByJobParamsSchema,
    jobApplicationParamsSchema,
    jobApplicationStatusBodySchema,
} from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("job-applications")
export class JobApplicationsController {
    constructor(
        @Inject(TOKENS.jobApplicationService) private readonly applications: IJobApplicationService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Get()
    async getAll() {
        const context = "[GET] /api/v1/job-applications";
        this.logger.info(context);
        try {
            return { jobs: await this.applications.getAll() };
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to get job applications", error);
        }
    }

    @Get("job/:jobId")
    async getByJobId(
        @Param({ schema: jobApplicationByJobParamsSchema }) params: z.infer<typeof jobApplicationByJobParamsSchema>
    ) {
        const context = `[GET] /api/v1/job-applications/job/${params.jobId}`;
        this.logger.info(context);
        try {
            const job = await this.applications.getByJobId(params.jobId);
            if (!job) {
                throw new NotFoundException({
                    error: `Job application not found for job ID: ${params.jobId}`,
                });
            }

            return { job };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundException({ error: error.message });
            }
            if (error instanceof NotFoundException) {
                throw error;
            }

            return throwInternalError(this.logger, context, "Failed to get job application", error);
        }
    }

    @Get(":id")
    async getById(@Param({ schema: jobApplicationParamsSchema }) params: z.infer<typeof jobApplicationParamsSchema>) {
        const context = `[GET] /api/v1/job-applications/${params.id}`;
        this.logger.info(context);
        try {
            return { job: await this.applications.getByIdOrThrow(params.id) };
        } catch (error) {
            if (error instanceof NotFoundError) {
                this.logger.error(`${context} Not found: ${error.message}`);
                throw new NotFoundException({ error: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to get job application", error);
        }
    }

    @Post(":id/status")
    @HttpCode(HttpStatus.OK)
    async updateStatus(
        @Param({ schema: jobApplicationParamsSchema }) params: z.infer<typeof jobApplicationParamsSchema>,
        @Body({ schema: jobApplicationStatusBodySchema }) body: z.infer<typeof jobApplicationStatusBodySchema>
    ) {
        const context = `[POST] /api/v1/job-applications/${params.id}/status`;
        this.logger.info(context);
        try {
            await this.applications.UpdateStatus(params.id, body.status, body.notes ?? "");
            return { job: undefined };
        } catch (error) {
            if (error instanceof NotFoundError) {
                this.logger.error(`${context} Not found: ${error.message}`);
                throw new NotFoundException({ error: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to update job application status", error);
        }
    }

    @Post("job/:jobId")
    async add(
        @Param({ schema: jobApplicationByJobParamsSchema }) params: z.infer<typeof jobApplicationByJobParamsSchema>
    ) {
        const context = `[POST] /api/v1/job-applications/job/${params.jobId}`;
        this.logger.info(context);
        try {
            await this.applications.add(params.jobId);
            return { message: `Job application added for job ID: ${params.jobId}` };
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to add job application", error);
        }
    }
}
