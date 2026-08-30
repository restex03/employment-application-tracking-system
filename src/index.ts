import { OllamaJobScoreEvaluator } from "./Evaluators/ShortlistEvaluator/Ollama/OllamaJobScoreEvaluator";
import { profiles } from "./JobCandidateProfile/candidateProfiles";
import { WorkdaySources } from "./Application/WorkdaySources/workdaySources";
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

import { WorkdayJobDetailsApiResponseMapper } from "./Infrastructure/APIs/ACL/Mappers/WorkdayJobDetailResponseMapper";
import { WorkdayJobDetailFetchService } from "./Application/Services/JobDetailFetch/Workday/WorkdayJobDetailFetchService";
import { IJobDetailFetchService } from "./Application/Services/JobDetailFetch/IJobDetailFetchService";
import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";

console.log("Starting application...");

const jobSources = WorkdaySources.filter(x => x.companyName === "Equifax");
for (const source of jobSources) {
    try {
        const { logger, jobScreeningSvc, jobScoringService, jobFetchService, jobDetailFetchService } =
            buildDependencies(source, LogLevel.Info);

        logger.info(`\n========== ${source.companyName} ==========`);
        logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);

        const rawJobsList = await jobFetchService.fetchJobs("software engineer");

        const screenedJobsList = await jobScreeningSvc.screen(rawJobsList);

        const proceedList = screenedJobsList
            .filter(x => x.disposition === "advance" || x.disposition === "review")
            .map(x => x.job);

        const jobDetailsList = await jobDetailFetchService.fetchJobDetails(proceedList);
        const evaluations = await jobScoringService.evaluate(profiles.profile_08_23_2026, jobDetailsList);

        for (const evaluation of evaluations) {
            logger.info("======================================================================");
            logger.info("======================================================================");
            logger.info(`${evaluation.jobId ?? "Unknown"}: ${evaluation.overallScore} - ${evaluation.recommendation}`);
            logger.info("----------------------------------------------------------------------");
            logger.info(`Summary: ${evaluation.summary}`);
            logger.info("======================================================================\n");
        }
    } catch (error) {
        console.error(
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
