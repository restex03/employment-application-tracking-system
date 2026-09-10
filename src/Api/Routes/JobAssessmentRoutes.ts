import { FastifyInstance } from "fastify";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobAssessmentService } from "../../Application/JobAssessment/IJobAssessmentService";

interface JobPostParams {
    jobPostId: string;
    candidateProfileId: string;
}

interface JobAssessmentRunBody {
    sourceId?: string;
}

export class JobAssessmentRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobAssessmentService: IJobAssessmentService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.post<{
            Params: JobPostParams;
        }>("/job-posts/:jobPostId/assessments/:candidateProfileId", async (request, reply) => {
            const { jobPostId, candidateProfileId } = request.params;

            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const result = await this.jobAssessmentService.runAssessment(candidateProfileId, jobPostId);
                return reply.code(200).send({
                    result,
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
                const result = await this.jobAssessmentService.getAssessment(jobPostId, candidateProfileId);

                return reply.code(200).send({
                    result,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get assessment: ${errMsg}`,
                });
            }
        });
    }
}
