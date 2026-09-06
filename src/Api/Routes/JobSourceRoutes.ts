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
                    this.logger.debug(`[GET /job-sources] companyName=${companyName}`);

                    const source = await this.jobSourceRepository.getByCompanyName(companyName);

                    return source ? [source] : [];
                }

                this.logger.debug("[GET /job-sources] Retrieving all job sources");

                const sources = await this.jobSourceRepository.getAll();
                return sources;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[GET /job-sources] Failed to retrieve job sources: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job sources: ${errMsg}`
                });
            }
        });

        server.get<{
            Params: JobSourceParams;
        }>("/job-sources/:sourceId", async (request, reply) => {
            try {
                const { sourceId } = request.params;
                this.logger.debug(`[GET /job-sources/${sourceId}] Retrieving job source`);

                const source = await this.jobSourceRepository.getById(sourceId);

                if (!source) {
                    this.logger.debug(`[GET /job-sources/${sourceId}] Job source not found`);
                    return reply.code(404).send({
                        message: "Job source not found.",
                    });
                }

                return source;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[GET /job-sources/${request.params.sourceId}] Failed to retrieve job source: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to retrieve job source: ${errMsg}`
                });
            }
        });
    }
}
