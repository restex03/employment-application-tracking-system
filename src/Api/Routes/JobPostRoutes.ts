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
        server.get("/job-posts", async () => {
            this.logger.debug("[GET /job-posts] Retrieving job posts");

            return this.jobPostService.getAll();
        });

        server.get<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId", async (request, reply) => {
            const jobPost = await this.jobPostService.getById(request.params.jobPostId);

            if (!jobPost) {
                return reply.code(404).send({
                    message: "Job post not found.",
                });
            }

            return jobPost;
        });

        server.post<{
            Body: SyncJobPostsBody;
        }>("/job-posts/sync", async (request, reply) => {
            try {
                const result = await this.jobPostSyncService.sync(request.body?.sourceId);

                return reply.code(200).send(result);
            } catch (error) {
                if (error instanceof Error && error.message.startsWith("Job source not found:")) {
                    return reply.code(404).send({
                        message: error.message,
                    });
                }

                throw error;
            }
        });
    }
}
