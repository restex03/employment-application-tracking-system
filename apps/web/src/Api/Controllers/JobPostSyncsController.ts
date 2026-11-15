import { Body, Controller, HttpCode, HttpStatus, Inject, NotFoundException, Post } from "@nestjs/common";
import { z } from "zod";
import { IJobPostSyncTaskRequest } from "../../Application/JobPostSync/Queue/IJobPostSyncJob";
import { IIngestionServiceGateway } from "../../Infrastructure/Ingestion/IIngestionServiceGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { jobPostSyncBodySchema } from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("job-post-syncs")
export class JobPostSyncsController {
    constructor(
        @Inject(TOKENS.ingestionGateway) private readonly ingestion: IIngestionServiceGateway,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async create(@Body({ schema: jobPostSyncBodySchema }) body: z.infer<typeof jobPostSyncBodySchema>) {
        const context = "[POST] /api/v1/job-post-syncs";
        this.logger.info(context);
        const sync: IJobPostSyncTaskRequest = { sourceIds: body.sourceIds, searchText: body.searchText };
        try {
            await this.ingestion.initiateJobPostSyncTask(sync);
            this.logger.info(`${context} Sync added to queue successfully`);
            return undefined;
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Job source not found:")) {
                this.logger.warn(`${context} ${error.message}`);
                throw new NotFoundException({ message: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to sync job posts", error);
        }
    }
}
