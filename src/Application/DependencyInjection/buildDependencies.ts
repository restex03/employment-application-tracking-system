import { IJobScreenEvaluator } from "../../Evaluators/JobScreenEvaluator/IJobScreenEvaluator";
import { OllamaJobScreenEvaluator } from "../../Evaluators/JobScreenEvaluator/Ollama/OllamaJobScreenEvaluator";
import { IJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/IJobMatchEvidenceEvaluator";
import { OllamaJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/Ollama/OllamaJobScoreEvaluator";
import { IJobRepository } from "../../Infrastructure/Persistence/IJobRepository";
import { SqliteJobRepository } from "../../Infrastructure/Persistence/Sqlite/Repositories/SqliteJobRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/Sqlite/SqliteDatabase";
import { OllamaClientConnection, OpenAiConnection } from "../../ModelConnections/Ollama/OllamaClientConnection";
import { ConsoleLogger } from "../Common/Logging/Console/ConsoleLogger";
import { ILogger } from "../Common/Logging/ILogger";
import { LogLevel } from "../Common/Logging/LogLevel";
import { IJobDetailFetchService } from "../Services/JobDetailFetch/IJobDetailFetchService";
import { WorkdayJobDetailFetchService } from "../Services/JobDetailFetch/Workday/WorkdayJobDetailFetchService";
import { IJobFetchService } from "../Services/JobFetch/IJobFetchService";
import { WorkdayJobFetchService } from "../Services/JobFetch/Workday/WorkdayJobFetchService";
import { IJobScoringService, JobScoringService } from "../Services/JobScoringService";
import { IJobScreeningService } from "../Services/JobScreening/IJobScreeningService";
import { JobScreeningService } from "../Services/JobScreening/JobScreeningService";
import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/workdaySources";
import { IJobGateway } from "../../Domain/JobPosts/IJobSource";
import {
    IWorkdayJobDetailsApiResponseMapper,
    WorkdayJobDetailsApiResponseMapper,
} from "../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobDetailsApiResponseMapper";
import {
    IWorkdayJobsApiResponseMapper,
    WorkdayJobsResponseMapper,
} from "../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobsApiResponseMapper";
import { WorkdayJobsGateway } from "../../Infrastructure/JobSources/Workday/WorkdayJobsGateway";

export function buildDependencies(source: IWorkdayJobSource, logLevel: LogLevel) {
    const logger: ILogger = new ConsoleLogger(logLevel);
    const gateway: IJobGateway = new WorkdayJobsGateway({
        companyName: source.companyName,
        baseUrl: source.baseUrl,
        logger,
    });

    const client: OpenAiConnection = new OllamaClientConnection();
    const screenEvaluator: IJobScreenEvaluator = new OllamaJobScreenEvaluator(client, logger);
    const jobScreeningSvc: IJobScreeningService = new JobScreeningService(screenEvaluator, logger);

    // TODO: Make singleton
    const sqlite = new SqliteDatabase("./data/job-app.db");

    const scoreEvaluator: IJobMatchEvidenceEvaluator = new OllamaJobMatchEvidenceEvaluator(client, logger);
    const jobScoringService: IJobScoringService = new JobScoringService(scoreEvaluator, logger);

    const workdayJobMapper: IWorkdayJobsApiResponseMapper = new WorkdayJobsResponseMapper(source.companyName);
    const workdayJobDetailMapper: IWorkdayJobDetailsApiResponseMapper = new WorkdayJobDetailsApiResponseMapper();
    const jobFetchService: IJobFetchService = new WorkdayJobFetchService(gateway, workdayJobMapper, logger);
    const jobDetailFetchService: IJobDetailFetchService = new WorkdayJobDetailFetchService(
        gateway,
        workdayJobDetailMapper,
        logger
    );

    const jobRepository: IJobRepository = new SqliteJobRepository(sqlite.connection);

    return {
        logger,
        jobScreeningSvc,
        jobScoringService,
        jobFetchService,
        jobDetailFetchService,
        jobRepository,
    };
}
