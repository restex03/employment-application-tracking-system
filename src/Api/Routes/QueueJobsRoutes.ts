import { FastifyInstance } from "fastify";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobAssessmentQueueService } from "../../Application/JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { IJobPostSyncQueueService } from "../../Application/JobPostSync/Queue/IJobPostSyncQueueService";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";

interface AssessmentJobParams {
    queueJobId: string;
}

export class QueueJobsRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobAssessmentQueueService: IJobAssessmentQueueService,
        private readonly jobPostSyncQueueService: IJobPostSyncQueueService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get(
            "/queue-jobs/assessments",
            { schema: { tags: ["Queue Jobs"] } },
            async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const jobs = await this.jobAssessmentQueueService.getActiveJobs();
                return reply.code(200).send({
                    jobs,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get job assessments: ${errMsg}`,
                });
            }
        });

        server.get<{
            Params: AssessmentJobParams;
        }>(
            "/queue-jobs/assessments/:queueJobId",
            { schema: { tags: ["Queue Jobs"] } },
            async (request, reply) => {
            const { queueJobId } = request.params;

            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const job = await this.jobAssessmentQueueService.getJobByIdOrThrow(queueJobId);

                return reply.code(200).send(job);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);

                if (error instanceof NotFoundError || errMsg.includes("not found")) {
                    this.logger.warn(`[${request.method}]  ${request.url} Job not found: ${errMsg}`);
                    return reply.code(404).send({
                        error: "Job not found.",
                    });
                }

                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get job status: ${errMsg}`,
                });
            }
        });

        server.get(
            "/queue-jobs/job-post-syncs",
            { schema: { tags: ["Queue Jobs"] } },
            async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const jobs = await this.jobPostSyncQueueService.getActiveJobs();

                return reply.code(200).send(jobs);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get job post sync jobs: ${errMsg}`,
                });
            }
        });
    }
}
