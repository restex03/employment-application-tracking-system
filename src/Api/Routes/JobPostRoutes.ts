import { FastifyInstance } from "fastify";
import { z } from "zod";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobPostService, JobPostQueryFilters, jobPostSortFields } from "../../Application/JobPost/IJobPostService";

interface JobPostParams {
    jobPostId: string;
}

export interface JobPostQuery {
    pageCount?: string;
    pageNumber?: string;
    companyName?: string;
    requisitionId?: string;
    title?: string;
    location?: string;
    postedDate?: string;
    jobMatchScore?: number;
    applicationStatus?: string;
    sortBy?: string;
    sortDirection?: string;
}

export class JobPostRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobPostService: IJobPostService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get<{
            Querystring: JobPostQuery;
        }>("/job-posts", {
            schema: {
                tags: ["Job Posts"],
                description: "List job posts sorted before pagination. sortBy: companyName, requisitionId, title, location, postedDate. sortDirection: asc or desc. Default: postedDate desc, unknown values last. postedDate filters on or after an ISO 8601 timestamp.",
            },
        }, async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url} Retrieving job posts`);
                const pageCount = Number(request.query.pageCount || "10");
                const pageNumber = Number(request.query.pageNumber || "1");
                const sort = z.object({
                    sortBy: z.enum(jobPostSortFields).default("postedDate"),
                    sortDirection: z.enum(["asc", "desc"]).default("desc"),
                }).safeParse({
                    sortBy: request.query.sortBy,
                    sortDirection: request.query.sortDirection,
                });
                if (!sort.success || !Number.isInteger(pageCount) || pageCount < 1 ||
                    !Number.isInteger(pageNumber) || pageNumber < 1) {
                    const errorMessage = "Invalid pagination or sort parameters. Use one supported sortBy and sortDirection asc or desc.";
                    this.logger.warn(`[${request.method}] ${request.url} ${errorMessage}`);
                    return reply.code(400).send({ error: errorMessage });
                }
                const rawJobMatchScore = request.query.jobMatchScore;
                const jobMatchScore =
                    rawJobMatchScore !== undefined && `${rawJobMatchScore}`.trim() !== ""
                        ? Number(rawJobMatchScore)
                        : undefined;
                const rawPostedDate = request.query.postedDate?.trim();
                if (rawPostedDate && !z.iso.datetime({ offset: true }).safeParse(rawPostedDate).success) {
                    const errorMessage = "postedDate must be an ISO 8601 timestamp with a timezone.";
                    this.logger.warn(`[${request.method}]  ${request.url} ${errorMessage}`);
                    return reply.code(400).send({ error: errorMessage });
                }
                const queryFilters: JobPostQueryFilters = {
                    companyName: request.query.companyName?.trim() ?? "",
                    requisitionId: request.query.requisitionId?.trim() ?? "",
                    title: request.query.title?.trim() ?? "",
                    location: request.query.location?.trim() ?? "",
                    postedDate: rawPostedDate || undefined,
                    jobMatchScore: Number.isNaN(jobMatchScore) ? undefined : jobMatchScore,
                    applicationStatus: request.query.applicationStatus?.trim() || undefined,
                    ...sort.data,
                };
                const result = await this.jobPostService.list(pageCount, pageNumber, queryFilters);
                return result;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                const aggregateMsg = `[${request.method}]  ${request.url} Failed to retrieve job posts: ${errMsg}`;
                this.logger.error(aggregateMsg);
                return reply.code(500).send({
                    error: aggregateMsg,
                });
            }
        });

        server.get<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId", { schema: { tags: ["Job Posts"] } }, async (request, reply) => {
            try {
                const { jobPostId } = request.params;
                this.logger.info(`[${request.method}]  ${request.url}`);

                const jobPost = await this.jobPostService.getById(jobPostId);

                if (!jobPost) {
                    this.logger.warn(`[${request.method}]  ${request.url} Job post not found`);
                    return reply.code(404).send({
                        message: "Job post not found.",
                    });
                }

                return jobPost;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed to retrieve job post: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job post: ${errMsg}`,
                });
            }
        });

    }
}
