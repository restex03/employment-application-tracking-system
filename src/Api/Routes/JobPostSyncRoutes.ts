import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobPostSyncTaskRequest } from "../../Application/JobPostSync/Queue/IJobPostSyncJob";
import { IIngestionServiceGateway } from "../../Infrastructure/Ingestion/IIngestionServiceGateway";

interface SyncJobPostsBody {
    sourceIds: string[];
    searchText?: string;
}

export class JobPostSyncRoutes implements IRouteRegistrar {
    constructor(
        private readonly ingestionGateway: IIngestionServiceGateway,
        private readonly logger: ILogger,
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
                const newJobSync: IJobPostSyncTaskRequest = {
                    sourceIds: request.body?.sourceIds,
                    searchText: request.body?.searchText,
                };
                await this.ingestionGateway.initiateJobPostSyncTask(newJobSync);

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

    }
}
