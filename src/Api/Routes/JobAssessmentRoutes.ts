import { FastifyInstance } from "fastify";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobAssessmentService } from "../../Application/JobAssessment/IJobAssessmentService";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobAssessmentQueueService } from "../../Application/JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { IJobAssessmentQueue } from "../../Infrastructure/Persistence/JobAssessmentQueue/IJobAssessmentQueue";

interface JobPostParams {
    jobPostId: string;
    candidateProfileId: string;
}

export class JobAssessmentRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobAssessmentService: IJobAssessmentService,
        private readonly jobAssessmentQueueService: IJobAssessmentQueueService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.post<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId/assessments/:candidateProfileId", async (request, reply) => {
            const { jobPostId, candidateProfileId } = request.params;

            try {
                this.logger.info(`[${request.method}]  ${request.url}`);

                const result = await this.jobAssessmentQueueService.enqueue({
                    jobPostId,
                    candidateProfileId,
                });
                return reply.code(202).send({
                    jobId: result,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Assessment failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to run job assessment: ${errMsg}`,
                });
            }
        });

        server.get<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId/assessments/:candidateProfileId", async (request, reply) => {
            const { jobPostId, candidateProfileId } = request.params;

            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const result = await this.jobAssessmentService.getAssessmentOrThrow(jobPostId, candidateProfileId);

                return reply.code(200).send(result);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                if (error instanceof NotFoundError) {
                    this.logger.error(`[${request.method}]  ${request.url} Not found: ${errMsg}`);
                    return reply.code(404).send({
                        error: errMsg,
                    });
                }

                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get assessment: ${errMsg}`,
                });
            }
        });
    }
}
