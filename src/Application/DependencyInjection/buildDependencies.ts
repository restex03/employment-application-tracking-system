import { SqliteJobRepository } from "../../Infrastructure/Persistence/JobPost/Sqlite/Repositories/SqliteJobRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabase";
import { ConsoleLogger } from "../../Infrastructure/Logging/Console/ConsoleLogger";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { LogLevel } from "../../Infrastructure/Logging/LogLevel";

import { IJobPostDiscoveryService } from "../JobPostDiscovery/IJobPostDiscoveryService";
import { WorkdayJobDiscoveryService } from "../JobPostDiscovery/Workday/WorkdayJobDiscoveryService";
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
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { JobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/JobRequirementsExtractionService";
import { IJobRequirementClassificationService } from "../JobAssessment/RquirementClassification/IJobRequirementClassificationService";
import { JobRequirementClassificationService } from "../JobAssessment/RquirementClassification/JobRequirementClassificationService";
import { IJobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/IJobRequirementMatchingService";
import { JobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/JobRequirementsMatchingService";
import { JobRequirementMatchMapper } from "../JobAssessment/RequirementMatching/Mappers/JobRequirementMatchMapper";
import { IJobRequirementMatchMapper } from "../JobAssessment/RequirementMatching/Mappers/IJobRequirementMatchMapper";
import { IJobRequirementDirectMatchingService } from "../JobAssessment/RequirementMatching/DirectMatching/IJobRequirementDirectMatchingService";
import { JobRequirementDirectMatchingService } from "../JobAssessment/RequirementMatching/DirectMatching/JobRequirementDirectMatchingService";
import { IJobRequirementTransferableMatchingService } from "../JobAssessment/RequirementMatching/TransferableMatching/IJobRequirementTransferableMatchingService";
import { JobRequirementTransferableMatchingService } from "../JobAssessment/RequirementMatching/TransferableMatching/JobRequirementTransferableMatchingService";
import { IJobPostService } from "../JobPost/IJobPostService";
import { JobPostService } from "../JobPost/JobPostService";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository ";
import { WorkdayJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/Workday/WorkdayJobSourceRepository";
import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/IWorkdayJobSource";
import { IApplicationDependencies } from "./IApplicationDependencies";
import { ISourceDependencies } from "./ISourceDependencies";

export function buildApplicationDependencies(logLevel: LogLevel): IApplicationDependencies {
    const logger: ILogger = new ConsoleLogger(logLevel);

    const sqlite = createSqliteDatabase();

    const jobPostRepository: IJobPostRepository = new SqliteJobRepository(sqlite.connection, logger);

    const jobSourceRepository: IJobSourceRepository = new WorkdayJobSourceRepository(sqlite.connection, logger);

    const jobPostService: IJobPostService = new JobPostService(jobPostRepository, logger);

    const llm: ILlmInferenceProvider = new OllamaInferenceProvider(logger);

    const screeningService: IJobScreeningService = new JobScreeningService(llm, logger);

    const requirementsExtractionService: IJobRequirementsExtractionService = new JobRequirementsExtractionService(
        llm,
        logger
    );

    const requirementsClassificationService: IJobRequirementClassificationService =
        new JobRequirementClassificationService(llm, logger);

    const directMatchingService: IJobRequirementDirectMatchingService = new JobRequirementDirectMatchingService(
        llm,
        logger
    );

    const transferableMatchingService: IJobRequirementTransferableMatchingService =
        new JobRequirementTransferableMatchingService(llm, logger);

    const jobRequirementMatchMapper: IJobRequirementMatchMapper = new JobRequirementMatchMapper();

    const requirementsMatchingService: IJobRequirementsMatchingService = new JobRequirementsMatchingService(
        directMatchingService,
        transferableMatchingService,
        jobRequirementMatchMapper,
        logger
    );

    logger.debug(`[buildApplicationDependencies] Application dependencies initialized`);

    logger.debug(`[buildApplicationDependencies] DB Connection Path: ${sqlite.connection.name}`);

    return {
        logger,
        sqlite,
        llm,
        jobPostRepository,
        jobPostService,
        screeningService,
        requirementsExtractionService,
        requirementsClassificationService,
        requirementsMatchingService,
        jobSourceRepository,
    };
}

export function buildSourceDependencies(source: IWorkdayJobSource, app: IApplicationDependencies): ISourceDependencies {
    const jobGateway: IJobGateway = new WorkdayJobsGateway({
        baseUrl: source.baseUrl,
        logger: app.logger,
    });

    const lookupMapper: IWorkdayJobsApiResponseMapper = new WorkdayJobsResponseMapper(source.id);

    const detailMapper: IWorkdayJobDetailsApiResponseMapper = new WorkdayJobDetailsApiResponseMapper();

    const jobFetchService: IJobPostDiscoveryService = new WorkdayJobDiscoveryService({
        jobGateway,
        detailMapper,
        lookupMapper,
        logger: app.logger,
    });

    app.logger.debug(
        `[buildSourceDependencies] Dependencies built for source: ` + `${source.companyName} at ${source.baseUrl}`
    );

    return {
        jobGateway,
        jobFetchService,
    };
}

function createSqliteDatabase(): SqliteDatabase {
    const dbPath = process.env.DB_PATH;

    if (!dbPath) {
        throw new Error("DB_PATH environment variable is not set.");
    }

    return new SqliteDatabase(dbPath);
}
