import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";

import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobSourceGateway } from "../../Infrastructure/JobSourcing/IJobSourceGateway";

interface JobSourceQuery {
    companyName?: string;
}

interface JobSourceParams {
    sourceId: string;
}

export class JobSourcesRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobSourceGateway: IJobSourceGateway,   
        private readonly logger: ILogger,
    ) {}

    public register(server: FastifyInstance): void {
        server.get<{
            Querystring: JobSourceQuery;
        }>(
            "/job-sources",
            { schema: { tags: ["Job Sources"] } },
            async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);

                const { companyName } = request.query;
                
                if (companyName) {
                    return await this.jobSourceGateway.getAllByCompanyName(companyName);
                }

                const sources = await this.jobSourceGateway.getAll();
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
        }>(
            "/job-sources/:sourceId",
            { schema: { tags: ["Job Sources"] } },
            async (request, reply) => {
            try {
                const { sourceId } = request.params;
                this.logger.info(`[${request.method}]  ${request.url}`);

                const source = await this.jobSourceGateway.getByIdOrThrow(sourceId);

                if (!source) {
                    this.logger.info(`[${request.method}]  ${request.url} Job source not found`);
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
