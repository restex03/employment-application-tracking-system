import { IJobScreenEvaluator } from "../../Evaluators/JobScreenEvaluator/IJobScreenEvaluator";
import { OllamaJobScreenEvaluator } from "../../Evaluators/JobScreenEvaluator/Ollama/OllamaJobScreenEvaluator";
import { IJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/IJobMatchEvidenceEvaluator";
import { OllamaJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/Ollama/OllamaJobScoreEvaluator";
import { IJobRepository } from "../Ports/Persistence/IJobRepository";
import { SqliteJobRepository } from "../../Infrastructure/Persistence/Sqlite/Repositories/SqliteJobRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/Sqlite/SqliteDatabase";
import { OllamaClientConnection, OpenAiConnection } from "../../Infrastructure/Inference/Ollama/OllamaClientConnection";
import { ConsoleLogger } from "../../Infrastructure/Logging/Console/ConsoleLogger";
import { ILogger } from "../Ports/Logging/ILogger";
import { LogLevel } from "../../Infrastructure/Logging/LogLevel";
import { IJobDetailFetchService } from "../JobDiscovery/JobDetailFetch/IJobDetailFetchService";
import { WorkdayJobDetailFetchService } from "../JobDiscovery/JobDetailFetch/Workday/WorkdayJobDetailFetchService";
import { IJobFetchService } from "../JobDiscovery/JobFetch/IJobFetchService";
import { WorkdayJobFetchService } from "../JobDiscovery/JobFetch/Workday/WorkdayJobFetchService";
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
import { IJobScoringService } from "../JobAssessment/Scoring/IJobScoringService";
import { JobScoringService } from "../JobAssessment/Scoring/JobScoringService";
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { JobScreeningService } from "../JobAssessment/Screening/JobScreeningService";

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
