import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobPostSyncService } from "../../Application/JobPostSync/IJobPostSyncService";
import { IJobPostSyncQueueService } from "../../Application/JobPostSync/Queue/IJobPostSyncQueueService";
import { IJobPostSyncJobRequest } from "../../Application/JobPostSync/Queue/IJobPostSyncJob";

interface JobPostParams {
    jobPostId: string;
}

interface SyncJobPostsBody {
    sourceIds: string[];
    searchText?: string;
}

export class JobPostSyncRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobPostSyncService: IJobPostSyncService,
        private readonly jobPostSyncQueueService: IJobPostSyncQueueService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.post<{
            Body: SyncJobPostsBody;
        }>(
            "/job-post-syncs",
            { schema: { tags: ["Job Post Syncs"] } },
            async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const newJobSync: IJobPostSyncJobRequest = {
                    sourceIds: request.body?.sourceIds,
                    searchText: request.body?.searchText,
                };
                await this.jobPostSyncQueueService.enqueue(newJobSync);

                this.logger.info(`[${request.method}]  ${request.url} Sync added to queue successfully`);
                return reply.code(202).send();
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
        }>(
            "/job-post-syncs/:jobPostId",
            { schema: { tags: ["Job Post Syncs"] } },
            async (request, reply) => {
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
