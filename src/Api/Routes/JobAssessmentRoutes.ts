import { FastifyInstance } from "fastify";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobAssessmentService } from "../../Application/JobAssessment/IJobAssessmentService";

interface JobPostParams {
    jobPostId: string;
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
        }>("/job-posts/:jobPostId/run-assessments", async (request, reply) => {
            const { jobPostId } = request.params;

            this.logger.debug(`[POST /job-posts/${jobPostId}/run-assessments] Assessment requested`);
            await this.jobAssessmentService.runAssessment(jobPostId);
            return reply.code(501).send({
                message: "Job assessment endpoint is not implemented yet.",
            });
        });

        server.post<{
            Body: JobAssessmentRunBody;
        }>("/job-assessment-runs", async (request, reply) => {
            const { sourceId } = request.body ?? {};

            this.logger.debug(`[POST /job-assessment-runs] sourceId=${sourceId ?? "all"}`);

            return reply.code(501).send({
                message: "Job assessment runs are not implemented yet.",
            });
        });
    }
}
