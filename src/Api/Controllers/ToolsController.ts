import { Controller, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";
import { IJobCandidateProfileService } from "../../Application/JobCandidateProfiles/IJobCandidateProfileService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { TOKENS } from "../../DependencyInjection/tokens";
import { throwInternalError } from "./controller-errors";

@Controller("tools")
export class ToolsController {
    constructor(
        @Inject(SqliteDatabaseConnection) private readonly database: SqliteDatabaseConnection,
        @Inject(TOKENS.candidateProfileService) private readonly profiles: IJobCandidateProfileService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Post("reset-db")
    @HttpCode(HttpStatus.OK)
    async resetDatabase() {
        const context = "[POST] /api/v1/tools/reset-db";
        this.logger.info(context);
        try {
            this.database.reset();
            await this.profiles.seedCandidateProfilesWithDefault();
            this.logger.info(`${context} Database reset completed`);
            return { message: "Database reset successfully." };
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to reset database", error);
        }
    }
}
