import { OllamaJobMatchEvaluator } from "./Evaluators/ShortlistEvaluator/Ollama/OllamaJobMatchEvaluator";
import { profiles } from "./JobCandidateProfile/candidateProfiles";
import { WorkdayJobsGateway } from "./Infrastructure/APIs/JobSources/Workday/WorkdayJobsGateway";
import { ConsoleLogger } from "./Application/Common/Logging/Console/ConsoleLogger";
import { workdaySources } from "./Application/WorkdaySources/workdaySources";
import { JobScoringService } from "./Application/Services/JobScoringService";
import { OllamaClientConnection } from "./ModelConnections/Ollama/OllamaClientConnection";
import { OllamaJobScreenEvaluator } from "./Evaluators/JobScreenEvaluator/Ollama/OllamaJobScreenEvaluator";
import { IJobScreenEvaluator } from "./Evaluators/JobScreenEvaluator/IJobScreenEvaluator";
import { SqliteJobRepository } from "./Infrastructure/Persistence/Sqlite/Repositories/SqliteJobRepository";
import { SqliteDatabase } from "./Infrastructure/Persistence/Sqlite/SqliteDatabase";
import { WorkdayJobFetchService } from "./Application/Services/JobFetch/Workday/WorkdayJobFetchService";
import { WorkdayJobsResponseMapper } from "./Infrastructure/APIs/ACL/Mappers/WorkdayJobsResponseMapper";
import { LogLevel } from "./Application/Common/Logging/LogLevel";
import { JobScreeningService } from "./Application/Services/JobScreening/JobScreeningService";

const logger = new ConsoleLogger(LogLevel.Info);

logger.info("Starting application...");

const client = new OllamaClientConnection();
const evaluator: IJobScreenEvaluator = new OllamaJobScreenEvaluator(client, logger);
const sqlite = new SqliteDatabase("./data/job-app.db");

const jobRepository = new SqliteJobRepository(sqlite.connection);

const jobSources = workdaySources;
for (const source of jobSources) {
    try {
        logger.info(`\n========== ${source.companyName} ==========`);
        logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);
        const gateway = new WorkdayJobsGateway({
            companyName: source.companyName,
            baseUrl: source.baseUrl,
            logger,
        });
        const mapper = new WorkdayJobsResponseMapper(source.companyName);
        const jobFetchSvc = new WorkdayJobFetchService(gateway, mapper, logger);
        const rawJobsList = await jobFetchSvc.fetchJobs();

        const jobScreeningSvc = new JobScreeningService(evaluator, logger);

        const screenedJobsList = await jobScreeningSvc.screen(rawJobsList);

        // const firstJob = jobsList[0];

        // logger.info(`Detail Path: ${firstJob.detailPath}`);

        // const detail = await gateway.getDetail(firstJob.detailPath);

        // const evaluator = new JobEvaluator(client, logger);

        // const scoringService = new JobScoringService(evaluator);

        // const [evaluation] = await scoringService.evaluate(profiles.profile_08_23_2026, [detail]);

        // const locations =
        //     detail.locations
        //         ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
        //         .join("\n") ?? "\t- None";

        // const locationsCount = detail.locations?.length ?? 0;

        // logger.info(`${detail.id ?? "Unknown"}: ${evaluation.overallScore} - ${evaluation.recommendation}`);
        // logger.info(`Job Title: ${detail.title}`);

        // logger.info(`Requisition ID: ${detail.requisitionId ?? "Unknown"}`);
        // logger.info(`Job Locations (${locationsCount}):\n${locations}`);
        // logger.info(`Job Description: ${detail.description.slice(0, 150)}...`);
    } catch (error) {
        logger.error(
            `Failed to retrieve jobs for ${source.companyName}`,
            error instanceof Error
                ? {
                      message: error.message,
                      stack: error.stack,
                  }
                : { error }
        );
    }
}

logger.info("\nFinished checking Workday sources.");
