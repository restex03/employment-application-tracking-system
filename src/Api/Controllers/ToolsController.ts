import { Controller, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";
import { IJobCandidateProfileService } from "../../Application/JobCandidateProfiles/IJobCandidateProfileService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { SqliteDatabaseProvider } from "../../Infrastructure/Persistence/SqliteDatabaseProvider";
import { TOKENS } from "../../DependencyInjection/tokens";
import { throwInternalError } from "./controller-errors";

@Controller("tools")
export class ToolsController {
    constructor(
        @Inject(SqliteDatabaseProvider) private readonly database: SqliteDatabaseProvider,
        @Inject(TOKENS.candidateProfileService) private readonly profiles: IJobCandidateProfileService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Post("reset-db")
    @HttpCode(HttpStatus.OK)
    async resetDatabase() {
        const context = "[POST] /api/v1/tools/reset-db";
        this.logger.info(context);
        try {
            this.database.client.transaction(() => {
                this.database.client.exec(`
                    DELETE FROM job_assessment_job_queue;
                    DELETE FROM job_assessments;
                    DELETE FROM candidate_employment_types;
                    DELETE FROM candidate_location_preferences;
                    DELETE FROM candidate_experience;
                    DELETE FROM candidate_skills;
                    DELETE FROM candidate_profiles;
                    DELETE FROM job_applications;
                `);
            })();
            await this.profiles.seedCandidateProfilesWithDefault();
            this.logger.info(`${context} Database reset completed`);
            return { message: "Database reset successfully." };
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to reset database", error);
        }
    }
}
