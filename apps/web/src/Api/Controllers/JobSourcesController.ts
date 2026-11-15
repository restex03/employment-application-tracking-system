import { Controller, Get, Inject, NotFoundException, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { IJobSourceGateway } from "../../Infrastructure/JobSourcing/IJobSourceGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { jobSourceParamsSchema, jobSourceQuerySchema } from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("job-sources")
export class JobSourcesController {
    constructor(
        @Inject(TOKENS.jobSourceGateway) private readonly jobSources: IJobSourceGateway,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Get()
    async getAll(@Query({ schema: jobSourceQuerySchema }) query: z.infer<typeof jobSourceQuerySchema>) {
        const context = "[GET] /api/v1/job-sources";
        this.logger.info(context);
        try {
            return query.companyName
                ? await this.jobSources.getAllByCompanyName(query.companyName)
                : await this.jobSources.getAll();
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to retrieve job sources", error);
        }
    }

    @Get(":sourceId")
    async getById(@Param({ schema: jobSourceParamsSchema }) params: z.infer<typeof jobSourceParamsSchema>) {
        const context = `[GET] /api/v1/job-sources/${params.sourceId}`;
        this.logger.info(context);
        try {
            const source = await this.jobSources.getByIdOrThrow(params.sourceId);
            if (!source) {
                this.logger.info(`${context} Job source not found`);
                throw new NotFoundException({ message: "Job source not found." });
            }

            return source;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            return throwInternalError(this.logger, context, "Failed to retrieve job source", error);
        }
    }
}
