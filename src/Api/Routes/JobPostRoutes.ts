import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostService, JobPostQueryFilters } from "../../Application/JobPost/IJobPostService";
import { IJobPostSyncService } from "../../Application/JobPostSync/IJobPostSyncService";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";

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
    jobScore?: number;
}

interface SyncJobPostsBody {
    sourceIds: string[];
}

export class JobPostRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobPostService: IJobPostService,
        private readonly jobPostSyncService: IJobPostSyncService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get<{
            Querystring: JobPostQuery;
        }>("/job-posts", async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url} Retrieving job posts`);
                const pageCount = parseInt(request.query.pageCount || "10");
                const pageNumber = parseInt(request.query.pageNumber || "1");
                const queryFilters = {
                    companyName: request.query.companyName?.trim() ?? "",
                    requisitionId: request.query.requisitionId?.trim() ?? "",
                    title: request.query.title?.trim() ?? "",
                    location: request.query.location?.trim() ?? "",
                    daysOld: request.query.daysOld?.trim() ?? "",
                    jobScore: request.query.jobScore,
                } as JobPostQueryFilters;
                const result = await this.jobPostService.getAll(pageCount, pageNumber, queryFilters);
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
        }>("/job-posts/:jobPostId", async (request, reply) => {
            try {
                const { jobPostId } = request.params;
                this.logger.info(`[${request.method}]  ${request.url}`);

                const jobPost = await this.jobPostService.getById(jobPostId);

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

        server.post<{
            Body: SyncJobPostsBody;
        }>("/job-posts/sync", async (request, reply) => {
            try {
                // TODO: Update this endpoint to accept a list of source IDs instead of just one.
                // TODO: Update this endpoint to run job in background and return a job ID for tracking progress.
                this.logger.info(`[${request.method}]  ${request.url}`);
                const result = await this.jobPostSyncService.syncJobs(request.body?.sourceIds);

                this.logger.info(`[${request.method}]  ${request.url} Sync completed successfully`);
                return reply.code(200).send(result);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);

                if (error instanceof Error && error.message.startsWith("Job source not found:")) {
                    this.logger.warn(`[${request.method}]  ${request.url} Job source not found: ${errMsg}`);
                    return reply.code(404).send({
                        message: error.message,
                    });
                }

                this.logger.error(`[${request.method}]  ${request.url} Sync failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to sync job posts: ${errMsg}`,
                });
            }
        });

        server.post<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId/sync", async (request, reply) => {
            try {
                const { jobPostId } = request.params;
                this.logger.info(`[${request.method}]  ${request.url}`);
                await this.jobPostSyncService.syncJobDetails(jobPostId);

                this.logger.info(`[${request.method}]  ${request.url} Sync completed successfully`);
                return reply.code(200).send();
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);

                this.logger.error(`[${request.method}]  ${request.url} Sync job post detail failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to sync job post details: ${errMsg}`,
                });
            }
        });
    }
}
