import { IJobScreenEvaluator } from "../../Evaluators/JobScreenEvaluator/IJobScreenEvaluator";
import { OllamaJobScreenEvaluator } from "../../Evaluators/JobScreenEvaluator/Ollama/OllamaJobScreenEvaluator";
import { IJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/IJobMatchEvidenceEvaluator";
import { OllamaJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/Ollama/OllamaJobMatchEvidenceEvaluator";
import { SqliteJobRepository } from "../../Infrastructure/Persistence/Sqlite/Repositories/SqliteJobRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/Sqlite/SqliteDatabase";
import { ConsoleLogger } from "../../Infrastructure/Logging/Console/ConsoleLogger";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { LogLevel } from "../../Infrastructure/Logging/LogLevel";

import { IJobPostFetchService } from "../JobDiscovery/IJobFetchService";
import { WorkdayJobFetchService } from "../JobDiscovery/Workday/WorkdayJobFetchService";
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
import { OllamaInferenceProvider } from "../../Infrastructure/Inference/Ollama/OllamaInferenceProvider";
import { ILlmInferenceProvider } from "../../Infrastructure/Inference/ILlmInferenceProvider";
import { IJobRepository } from "../../Infrastructure/Persistence/IJobRepository";

export function buildDependencies(source: IWorkdayJobSource, logLevel: LogLevel) {
    const logger: ILogger = new ConsoleLogger(logLevel);
    const jobGateway: IJobGateway = new WorkdayJobsGateway({
        companyName: source.companyName,
        baseUrl: source.baseUrl,
        logger,
    });

    const llm: ILlmInferenceProvider = new OllamaInferenceProvider(logger);
    const screenEvaluator: IJobScreenEvaluator = new OllamaJobScreenEvaluator(llm, logger);
    const jobScreeningSvc: IJobScreeningService = new JobScreeningService(screenEvaluator, logger);

    // TODO: Make singleton
    const sqlite = new SqliteDatabase("./data/job-app.db");

    const scoreEvaluator: IJobMatchEvidenceEvaluator = new OllamaJobMatchEvidenceEvaluator(llm, logger);
    const jobScoringService: IJobScoringService = new JobScoringService(scoreEvaluator, logger);

    const lookupMapper: IWorkdayJobsApiResponseMapper = new WorkdayJobsResponseMapper(source.companyName);
    const detailMapper: IWorkdayJobDetailsApiResponseMapper = new WorkdayJobDetailsApiResponseMapper();
    const jobFetchService: IJobPostFetchService = new WorkdayJobFetchService({
        jobGateway,
        detailMapper,
        lookupMapper,
        logger,
    });

    const jobRepository: IJobRepository = new SqliteJobRepository(sqlite.connection);

    return {
        logger,
        jobScreeningSvc,
        jobScoringService,
        jobFetchService,
        jobRepository,
    };
}
