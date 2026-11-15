import { Controller, Get, Inject, Logger, NotFoundException, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { IJobPostService } from "../../Application/JobPost/IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { jobPostParamsSchema, jobPostQuerySchema } from "../Schemas/JobPostSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("job-posts")
export class JobPostsController {
    constructor(
        @Inject(TOKENS.jobPostService) private readonly jobPosts: IJobPostService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Get()
    async list(@Query({ schema: jobPostQuerySchema }) query: z.infer<typeof jobPostQuerySchema>) {
        this.logger.info("[GET] /api/v1/job-posts Retrieving job posts");
        const { pageCount, pageNumber, ...filters } = query;
        try {
            return await this.jobPosts.list(pageCount, pageNumber, filters);
        } catch (error) {
            return throwInternalError(this.logger, "[GET] /api/v1/job-posts", "Failed to retrieve job posts", error);
        }
    }

    @Get(":jobPostId")
    async getById(@Param({ schema: jobPostParamsSchema }) params: z.infer<typeof jobPostParamsSchema>) {
        const context = `[GET] /api/v1/job-posts/${params.jobPostId}`;
        this.logger.info(context);
        try {
            const jobPost = await this.jobPosts.getById(params.jobPostId);
            if (!jobPost) {
                this.logger.warn(`${context} Job post not found`);
                throw new NotFoundException({ message: "Job post not found." });
            }

            return jobPost;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            return throwInternalError(this.logger, context, "Failed to retrieve job post", error);
        }
    }
}
