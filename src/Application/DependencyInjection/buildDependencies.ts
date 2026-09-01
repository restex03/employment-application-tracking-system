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
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { JobScreeningService } from "../JobAssessment/Screening/Ollama/JobScreeningService";
import { OllamaInferenceProvider } from "../../Infrastructure/Inference/Ollama/OllamaInferenceProvider";
import { ILlmInferenceProvider } from "../../Infrastructure/Inference/ILlmInferenceProvider";
import { IJobRepository } from "../../Infrastructure/Persistence/IJobRepository";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { JobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/JobRequirementsExtractionService";
import { IJobRequirementClassificationService } from "../JobAssessment/RquirementClassification/IJobRequirementClassificationService";
import { JobRequirementClassificationService } from "../JobAssessment/RquirementClassification/JobRequirementClassificationService";
import { IJobRequirementsMatchingService } from "../JobAssessment/Requirement Matching/IJobRequirementMatchingService";
import { JobRequirementsMatchingService } from "../JobAssessment/Requirement Matching/JobRequirementsMatchingService";
import { JobRequirementMatchMapper } from "../JobAssessment/Requirement Matching/Mappers/JobRequirementMatchMapper";
import { IJobRequirementMatchMapper } from "../JobAssessment/Requirement Matching/Mappers/IJobRequirementMatchMapper";

export function buildDependencies(source: IWorkdayJobSource, logLevel: LogLevel) {
    const logger: ILogger = new ConsoleLogger(logLevel);
    const jobGateway: IJobGateway = new WorkdayJobsGateway({
        companyName: source.companyName,
        baseUrl: source.baseUrl,
        logger,
    });

    const llm: ILlmInferenceProvider = new OllamaInferenceProvider(logger);
    const jobScreeningService: IJobScreeningService = new JobScreeningService(llm, logger);

    // TODO: Make singleton
    const sqlite = new SqliteDatabase("./data/job-app.db");

    const lookupMapper: IWorkdayJobsApiResponseMapper = new WorkdayJobsResponseMapper(source.companyName);
    const detailMapper: IWorkdayJobDetailsApiResponseMapper = new WorkdayJobDetailsApiResponseMapper();
    const jobFetchService: IJobPostFetchService = new WorkdayJobFetchService({
        jobGateway,
        detailMapper,
        lookupMapper,
        logger,
    });

    const screeningService: IJobScreeningService = new JobScreeningService(llm, logger);
    const requirementsExtractionService: IJobRequirementsExtractionService = new JobRequirementsExtractionService(
        llm,
        logger
    );
    const requirementsClassificationService: IJobRequirementClassificationService =
        new JobRequirementClassificationService(llm, logger);

    const jobRequirementMatchMapper: IJobRequirementMatchMapper = new JobRequirementMatchMapper();
    const requirementsMatchingService: IJobRequirementsMatchingService = new JobRequirementsMatchingService(
        llm,
        logger,
        jobRequirementMatchMapper
    );

    const jobRepository: IJobRepository = new SqliteJobRepository(sqlite.connection);

    return {
        logger,
        jobScreeningService,
        jobFetchService,
        screeningService,
        requirementsExtractionService,
        requirementsClassificationService,
        requirementsMatchingService,
        jobRepository,
    };
}
