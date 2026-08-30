import { OllamaJobScoreEvaluator } from "./Evaluators/ShortlistEvaluator/Ollama/OllamaJobScoreEvaluator";
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
import {
    IWorkdayJobsApiResponseMapper,
    WorkdayJobsResponseMapper,
} from "./Infrastructure/APIs/ACL/Mappers/WorkdayJobsResponseMapper";
import { LogLevel } from "./Application/Common/Logging/LogLevel";
import { JobScreeningService } from "./Application/Services/JobScreening/JobScreeningService";
import { IJobScoreEvaluator } from "./Evaluators/ShortlistEvaluator/IJobScoreEvaluator";
import { IJobSearchResult } from "./Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobPostingDetail } from "./Infrastructure/APIs/JobSources/IJobPostingDetail";
import {
    IWorkdayJobDetailsApiResponseMapper,
    WorkdayJobDetailApiResponseMapper as WorkdayJobDetailsApiResponseMapper,
} from "./Infrastructure/APIs/ACL/Mappers/WorkdayJobDetailResponseMapper";
import { WorkdayJobDetailFetchService } from "./Application/Services/JobDetailFetch/Workday/WorkdayJobDetailFetchService";
import { IJobDetailFetchService } from "./Application/Services/JobDetailFetch/IJobDetailFetchService";

const logger = new ConsoleLogger(LogLevel.Info);

logger.info("Starting application...");

const client = new OllamaClientConnection();
const screenEvaluator: IJobScreenEvaluator = new OllamaJobScreenEvaluator(client, logger);
const sqlite = new SqliteDatabase("./data/job-app.db");

const jobRepository = new SqliteJobRepository(sqlite.connection);

const jobSources = workdaySources.filter(x => x.companyName === "Equifax");
for (const source of jobSources) {
    try {
        logger.info(`\n========== ${source.companyName} ==========`);
        logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);
        const gateway = new WorkdayJobsGateway({
            companyName: source.companyName,
            baseUrl: source.baseUrl,
            logger,
        });
        const mapper: IWorkdayJobsApiResponseMapper = new WorkdayJobsResponseMapper(source.companyName);
        const detailMapper = new WorkdayJobDetailsApiResponseMapper();
        const jobFetchSvc = new WorkdayJobFetchService(gateway, mapper, logger);
        const jobDetailFetchSv: IJobDetailFetchService = new WorkdayJobDetailFetchService(
            gateway,
            detailMapper,
            logger
        );

        const rawJobsList = await jobFetchSvc.fetchJobs("software engineer");

        const jobScreeningSvc = new JobScreeningService(screenEvaluator, logger);
        const screenedJobsList = await jobScreeningSvc.screen(rawJobsList);

        const scoreEvaluator: IJobScoreEvaluator = new OllamaJobScoreEvaluator(client, logger);
        const scoringService = new JobScoringService(scoreEvaluator);

        const proceedList = screenedJobsList
            .filter(x => x.disposition === "advance" || x.disposition === "review")
            .map(x => x.job);

        const jobDetailsList: IJobPostingDetail[] = await jobDetailFetchSv.fetchJobDetails(proceedList);
        const evaluations = await scoringService.evaluate(profiles.profile_08_23_2026, jobDetailsList);

        for (const evaluation of evaluations) {
            logger.info("======================================================================");
            logger.info("======================================================================");
            logger.info(`${evaluation.jobId ?? "Unknown"}: ${evaluation.overallScore} - ${evaluation.recommendation}`);
            logger.info("----------------------------------------------------------------------");
            logger.info(`Summary: ${evaluation.summary}`);
            logger.info("======================================================================\n");
        }
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
