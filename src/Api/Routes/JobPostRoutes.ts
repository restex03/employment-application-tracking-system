import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobPostResultService, JobPostQueryFilters } from "../../Application/JobPost/IJobPostResultService";

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
    daysOld?: string;
    jobMatchScore?: number;
    applicationStatus?: string;
}

export class JobPostRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobPostResultService: IJobPostResultService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get<{
            Querystring: JobPostQuery;
        }>(
            "/job-posts",
            { schema: { tags: ["Job Posts"] } },
            async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url} Retrieving job posts`);
                const pageCount = parseInt(request.query.pageCount || "10");
                const pageNumber = parseInt(request.query.pageNumber || "1");
                const rawJobMatchScore = request.query.jobMatchScore;
                const jobMatchScore =
                    rawJobMatchScore !== undefined && `${rawJobMatchScore}`.trim() !== ""
                        ? Number(rawJobMatchScore)
                        : undefined;
                const rawDaysOld = request.query.daysOld;
                const daysOld =
                    rawDaysOld !== undefined && `${rawDaysOld}`.trim() !== "" ? Number(rawDaysOld) : undefined;
                const queryFilters = {
                    companyName: request.query.companyName?.trim() ?? "",
                    requisitionId: request.query.requisitionId?.trim() ?? "",
                    title: request.query.title?.trim() ?? "",
                    location: request.query.location?.trim() ?? "",
                    daysOld: Number.isNaN(daysOld) ? undefined : daysOld,
                    jobMatchScore: Number.isNaN(jobMatchScore) ? undefined : jobMatchScore,
                    applicationStatus: request.query.applicationStatus?.trim() || undefined,
                } as JobPostQueryFilters;
                const result = await this.jobPostResultService.getAll(pageCount, pageNumber, queryFilters);
                return result;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed to retrieve job posts: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job posts: ${errMsg}`,
                });
            }
        });

        server.get<{
            Params: JobPostParams;
        }>(
            "/job-posts/:jobPostId",
            { schema: { tags: ["Job Posts"] } },
            async (request, reply) => {
            try {
                const { jobPostId } = request.params;
                this.logger.info(`[${request.method}]  ${request.url}`);

                const jobPost = await this.jobPostResultService.getByIdOrThrow(jobPostId);

                if (!jobPost) {
                    this.logger.info(`[${request.method}]  ${request.url} Job post not found`);
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
