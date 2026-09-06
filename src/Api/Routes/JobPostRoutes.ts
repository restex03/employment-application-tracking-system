import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostService } from "../../Application/JobPost/IJobPostService";
import { IJobPostSyncService } from "../../Application/JobPostSync/IJobPostSyncService";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";

interface JobPostParams {
    jobPostId: string;
}

interface SyncJobPostsBody {
    sourceId?: string;
}

export class JobPostRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobPostService: IJobPostService,
        private readonly jobPostSyncService: IJobPostSyncService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get("/job-posts", async (request, reply) => {
            try {
                this.logger.debug("[GET /job-posts] Retrieving job posts");
                const jobPosts = await this.jobPostService.getAll();
                return jobPosts;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[GET /job-posts] Failed to retrieve job posts: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job posts: ${errMsg}`
                });
            }
        });

        server.get<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId", async (request, reply) => {
            try {
                const { jobPostId } = request.params;
                this.logger.debug(`[GET /job-posts/${jobPostId}] Retrieving job post`);
                
                const jobPost = await this.jobPostService.getById(jobPostId);

                if (!jobPost) {
                    this.logger.debug(`[GET /job-posts/${jobPostId}] Job post not found`);
                    return reply.code(404).send({
                        message: "Job post not found.",
                    });
                }

                return jobPost;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[GET /job-posts] Failed to retrieve job post: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job post: ${errMsg}`
                });
            }
        });

        server.post<{
            Body: SyncJobPostsBody;
        }>("/job-posts/sync", async (request, reply) => {
            try {
                // TODO: Update this endpoint to accept a list of source IDs instead of just one.
                // TODO: Update this endpoint to run job in background and return a job ID for tracking progress.
                this.logger.debug("[POST /job-posts/sync] Sync requested");
                const result = await this.jobPostSyncService.sync(request.body?.sourceId);

                this.logger.info("[POST /job-posts/sync] Sync completed successfully");
                return reply.code(200).send(result);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                
                if (error instanceof Error && error.message.startsWith("Job source not found:")) {
                    this.logger.warn(`[POST /job-posts/sync] Job source not found: ${errMsg}`);
                    return reply.code(404).send({
                        message: error.message,
                    });
                }

                this.logger.error(`[POST /job-posts/sync] Sync failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to sync job posts: ${errMsg}`
                });
            }
        });
    }
}
