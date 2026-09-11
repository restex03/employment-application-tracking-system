import { readFileSync } from "fs";
import { IJobSource } from "../../../Domain/JobSources/IJobSource";
import { IJobSourceService } from "../IJobSourceService";
import { IJobSourceRepository } from "../../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { WorkdayBaseUrlMapper } from "./Mappers/WorkdayBaseUrlMapper";

export class JobSourceService implements IJobSourceService {
    constructor(
        private readonly jobSourceRepo: IJobSourceRepository,
        private readonly logger: ILogger
    ) {}
    async seedDefaultWorkdayJobSources(): Promise<void> {
        const jsonPath = process.env.WORKDAY_SOURCES;
        if (!jsonPath) {
            throw new Error("WORKDAY_SOURCES environment variable is not set");
        }

        this.logger.info(
            `[JobSourceService.seedDefaultWorkdayJobSources] Seeding Workday job sources from: ${jsonPath}`
        );

        try {
            const json = readFileSync(jsonPath, "utf-8");
            const workdaySources = JSON.parse(json) as IJobSource[];

            // Validate that we have an array of sources
            if (!Array.isArray(workdaySources)) {
                throw new Error("Invalid Workday sources file: expected an array");
            }

            // Validate each source has required fields and convert to JobSourceInput
            const validSources = workdaySources.map(source => {
                if (!source.companyName || !source.baseUrl) {
                    throw new Error(
                        `Invalid Workday source: missing required fields for source ${source.companyName || "unknown"}`
                    );
                }
                // Return JobSourceInput by omitting the id field
                return {
                    companyName: source.companyName,
                    baseUrl: source.baseUrl,
                    browserBaseUrl: WorkdayBaseUrlMapper.deriveBrowserBaseUrl(source.baseUrl),
                };
            });

            const results = await this.jobSourceRepo.upsertMany(validSources);
            this.logger.info(
                `[JobSourceService.seedDefaultWorkdayJobSources] Successfully seeded ${results.length} Workday job sources`
            );
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `[JobSourceService.seedDefaultWorkdayJobSources] Failed to seed Workday job sources: ${errMsg}`
            );
            throw new Error(`Failed to seed Workday job sources: ${errMsg}`);
        }
    }
    async getJobSources(): Promise<IJobSource[]> {
        const result = await this.jobSourceRepo.getAll();
        return result;
    }
}
