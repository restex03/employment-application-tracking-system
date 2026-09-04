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
        }>("/job-sources", async request => {
            const { companyName } = request.query;

            if (companyName) {
                this.logger.debug(`[GET /job-sources] companyName=${companyName}`);

                const source = await this.jobSourceRepository.getByCompanyName(companyName);

                return source ? [source] : [];
            }

            this.logger.debug("[GET /job-sources] Retrieving all job sources");

            return this.jobSourceRepository.getAll();
        });

        server.get<{
            Params: JobSourceParams;
        }>("/job-sources/:sourceId", async (request, reply) => {
            const source = await this.jobSourceRepository.getById(request.params.sourceId);

            if (!source) {
                return reply.code(404).send({
                    message: "Job source not found.",
                });
            }

            return source;
        });
    }
}
