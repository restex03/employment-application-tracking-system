import { FastifyInstance, FastifyRequest } from "fastify";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobApplicationService } from "../../Application/JobApplications/IJobApplicationService";
import { JobApplicationStatus } from "../../Domain/JobApplications/IJobApplication";

export class JobApplicationRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobApplicationService: IJobApplicationService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get("/job-applications", async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const jobs = await this.jobApplicationService.getAll();

                return reply.code(200).send({
                    jobs,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get job applications: ${errMsg}`,
                });
            }
        });

        server.get("/job-applications/:id", async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const { id } = request.params as { id: string };
                const jobApplication = await this.jobApplicationService.getByIdOrThrow(id);

                return reply.code(200).send({
                    job: jobApplication,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                if (error instanceof NotFoundError) {
                    this.logger.error(`[${request.method}]  ${request.url} Not found: ${errMsg}`);
                    return reply.code(404).send({
                        error: errMsg,
                    });
                }

                return reply.code(500).send({
                    error: `Failed to get job application: ${errMsg}`,
                });
            }
        });

        server.post(
            "/job-applications/:id",
            async (request: FastifyRequest<{ Body: { status: JobApplicationStatus } }>, reply) => {
                try {
                    this.logger.info(`[${request.method}]  ${request.url}`);
                    const { id } = request.params as { id: string };
                    const { status } = request.body;
                    const jobApplication = await this.jobApplicationService.UpdateStatus(id, status);

                    return reply.code(200).send({
                        job: jobApplication,
                    });
                } catch (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                    if (error instanceof NotFoundError) {
                        this.logger.error(`[${request.method}]  ${request.url} Not found: ${errMsg}`);
                        return reply.code(404).send({
                            error: errMsg,
                        });
                    }

                    return reply.code(500).send({
                        error: `Failed to update job application status: ${errMsg}`,
                    });
                }
            }
        );

        server.get("/job-applications/job/:jobId", async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const { jobId } = request.params as { jobId: string };
                const job = await this.jobApplicationService.getByJobId(jobId);
                if (!job) {
                    return reply.code(404).send({
                        error: `Job application not found for job ID: ${jobId}`,
                    });
                }
                return reply.code(200).send({
                    job,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to get job application: ${errMsg}`,
                });
            }
        });

        server.post("/job-applications/job/:jobId", async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                const { jobId } = request.params as { jobId: string };
                await this.jobApplicationService.add(jobId);

                return reply.code(201).send({
                    message: `Job application added for job ID: ${jobId}`,
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to add job application: ${errMsg}`,
                });
            }
        });
    }
}
