import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";

import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";

interface JobSourceQuery {
    companyName?: string;
}

interface JobSourceParams {
    sourceId: string;
}

export class JobSourceRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobSourceRepository: IJobSourceRepository,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get<{
            Querystring: JobSourceQuery;
        }>("/job-sources", async (request, reply) => {
            try {
                const { companyName } = request.query;

                if (companyName) {
                    this.logger.debug(`[${request.method}]  ${request.url}`);

                    const source = await this.jobSourceRepository.getByCompanyName(companyName);

                    return source ? [source] : [];
                }

                this.logger.debug(`[${request.method}]  ${request.url}`);

                const sources = await this.jobSourceRepository.getAll();
                return sources;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed to retrieve job sources: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job sources: ${errMsg}`,
                });
            }
        });

        server.get<{
            Params: JobSourceParams;
        }>("/job-sources/:sourceId", async (request, reply) => {
            try {
                const { sourceId } = request.params;
                this.logger.debug(`[${request.method}]  ${request.url}`);

                const source = await this.jobSourceRepository.getById(sourceId);

                if (!source) {
                    this.logger.debug(`[${request.method}]  ${request.url} Job source not found`);
                    return reply.code(404).send({
                        message: "Job source not found.",
                    });
                }

                return source;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Failed to retrieve job source: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job source: ${errMsg}`,
                });
            }
        });
    }
}
