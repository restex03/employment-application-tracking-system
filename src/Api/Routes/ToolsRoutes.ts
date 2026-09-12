import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobSourceService } from "../../Application/JobSources/IJobSourceService";
import { IJobCandidateProfileService } from "../../Application/JobCandidateProfiles/IJobCandidateProfileService";

export class ToolsRoutes implements IRouteRegistrar {
    constructor(
        private readonly sqliteConnection: SqliteDatabaseConnection,
        private readonly jobSourceService: IJobSourceService,
        private readonly jobCandidateProfileService: IJobCandidateProfileService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.post("/tools/reset-db", async (request, reply) => {
            try {
                this.logger.info(`[${request.method}]  ${request.url}`);
                this.sqliteConnection.reset();
                this.jobSourceService.seedDefaultWorkdayJobSources();
                this.jobCandidateProfileService.seedCandidateProfilesWithDefault();
                this.logger.info(`[${request.method}]  ${request.url} Database reset completed`);
                return reply.code(200).send({
                    message: "Database reset successfully.",
                });
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[${request.method}]  ${request.url} Reset failed: ${errMsg}`);
                return reply.code(500).send({
                    error: `Failed to reset database: ${errMsg}`,
                });
            }
        });
    }
}
