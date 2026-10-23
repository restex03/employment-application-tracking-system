import { SqliteJobRepository } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteJobRepository";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import path from "path";
import { ConsoleLogger } from "../../Infrastructure/Logging/Console/ConsoleLogger";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { LogLevel } from "../../Infrastructure/Logging/LogLevel";
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { JobScreeningService } from "../JobAssessment/Screening/Ollama/JobScreeningService";
import { OpenAiInferenceProvider } from "../../Infrastructure/Inference/OpenAi/OpenAiInferenceProvider";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { JobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/JobRequirementsExtractionService";
import { IJobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/IJobRequirementMatchingService";
import { JobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/JobRequirementsMatchingService";
import { JobRequirementMatchMapper } from "../JobAssessment/RequirementMatching/Mappers/JobRequirementMatchMapper";
import { IJobRequirementMatchMapper } from "../JobAssessment/RequirementMatching/Mappers/IJobRequirementMatchMapper";
import { IJobRequirementDirectMatchingService } from "../JobAssessment/RequirementMatching/DirectMatching/IJobRequirementDirectMatchingService";
import { JobRequirementDirectMatchingService } from "../JobAssessment/RequirementMatching/DirectMatching/JobRequirementDirectMatchingService";
import { IJobRequirementTransferableMatchingService } from "../JobAssessment/RequirementMatching/TransferableMatching/IJobRequirementTransferableMatchingService";
import { JobRequirementTransferableMatchingService } from "../JobAssessment/RequirementMatching/TransferableMatching/JobRequirementTransferableMatchingService";
import { IApplicationDependencies } from "./IApplicationDependencies";
import { IJobAssessmentService } from "../JobAssessment/IJobAssessmentService";
import { JobAssessmentService } from "../JobAssessment/JobAssessmentService";
import { ScreenJob } from "../JobAssessment/Pipeline/Steps/ScreenJob";
import { IJobAssessmentContext } from "../JobAssessment/Pipeline/IJobAssessmentContext";
import { ExtractJobRequirements } from "../JobAssessment/Pipeline/Steps/ExtractJobRequirements";
import { MatchJobRequirements } from "../JobAssessment/Pipeline/Steps/MatchJobRequirements";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { SqliteJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/Sqlite/SqliteJobCandidateProfileRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { IJobCandidateProfileService } from "../JobCandidateProfiles/IJobCandidateProfileService";
import { JobCandidateProfileService } from "../JobCandidateProfiles/JobCandidateProfileService";
import { CalculateJobMatchScore } from "../JobAssessment/Pipeline/Steps/CalculateJobMatchScore";
import { JobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/JobMatchScoreCalculator";
import { IJobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/IJobMatchScoreCalculator";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { SqliteJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/Sqlite/SqliteJobAssessmentRepository";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";
import { SqliteJobQueries } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteJobQueries";
import { JobAssessmentQueueService } from "../JobAssessment/PipelineQueue/JobAssessmentQueueService";
import { IJobAssessmentQueueService } from "../JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { IJobAssessmentQueueWorkerService } from "../JobAssessment/PipelineQueue/IJobAssessmentQueueWorkerService";
import { JobAssessmentQueueWorkerService } from "../JobAssessment/PipelineQueue/JobAssessmentQueueWorkerService";
import {
    ILlmTargetOptions,
    LlmTargetRegistry,
} from "../../Infrastructure/Inference/OpenAi/LlmTargetRegistry/LlmTargetRegistry";
import { IJobAssessmentQueue } from "../../Infrastructure/Persistence/Queues/JobAssessmentQueue/IJobAssessmentQueue";
import { SqliteJobAssessmentQueueRepository } from "../../Infrastructure/Persistence/Queues/JobAssessmentQueue/Sqlite/SqliteJobAssessmentQueueRepository";
import { IJobApplicationRepository } from "../../Infrastructure/Persistence/JobApplications/IJobApplicationRepository";
import { JobApplicationRepository } from "../../Infrastructure/Persistence/JobApplications/JobApplicationRepository";
import { IFileSystemRepository } from "../../Infrastructure/Persistence/FileSystem/IFileSystemRepository";
import { FileSystemRepository } from "../../Infrastructure/Persistence/FileSystem/FileSystemRepository";
import { IJobApplicationService } from "../JobApplications/IJobApplicationService";
import { JobApplicationService } from "../JobApplications/JobApplicationService";
import { GenerateStructuredRetryStrategyProvider } from "../../Infrastructure/Inference/OpenAi/InferenceRetries/GenerateStructuredRetryStrategyProvider";
import { JobPostService } from "../JobPost/JobPostService";
import { IJobPostService } from "../JobPost/IJobPostService";

import { IIngestionServiceGateway, IngestionServiceGateway } from "../../Infrastructure/Ingestion/IIngestionServiceGateway";
import { IJobSourceGateway, JobSourceGateway } from "../../Infrastructure/JobSourcing/IJobSourceGateway";
import { IJobPostGateway, JobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";

export function buildDependencies(logLevel: LogLevel): IApplicationDependencies {
    const logger: ILogger = new ConsoleLogger(logLevel);

    /*
     * Persistence
     */
    const sqliteConnection = createSqliteConnection();

    const jobPostRepository: IJobPostRepository = new SqliteJobRepository(sqliteConnection.db, logger);

    const jobCandidateProfileRepo: IJobCandidateProfileRepository = new SqliteJobCandidateProfileRepository(
        sqliteConnection.db,
        logger
    );
    const jobCandidateProfileService: IJobCandidateProfileService = new JobCandidateProfileService(
        jobCandidateProfileRepo,
        logger
    );

    const jobAssessmentRepo: IJobAssessmentRepository = new SqliteJobAssessmentRepository(sqliteConnection.db, logger);

    const jobApplicationRepository: IJobApplicationRepository = new JobApplicationRepository(
        sqliteConnection.db,
        logger
    );
    const fileSystemRepository: IFileSystemRepository = new FileSystemRepository(getDataDirectory(), logger);

    const jobPostQueries: IJobPostQueries = new SqliteJobQueries(sqliteConnection.db, logger);
    const jobAssessmentQueue: IJobAssessmentQueue = new SqliteJobAssessmentQueueRepository(sqliteConnection.db, logger);
    

    /*
     * Inference
     */
    let llmTargetOptions: ILlmTargetOptions = LlmTargetRegistry.Mistral_Medium_3_5_hosted;
    const retryStrategyProvider = new GenerateStructuredRetryStrategyProvider();

    const inferenceProvider = new OpenAiInferenceProvider(logger, llmTargetOptions, retryStrategyProvider);

    /*
     * Application Services
     */

    const screeningService: IJobScreeningService = new JobScreeningService(inferenceProvider, logger);

    const requirementsExtractionService: IJobRequirementsExtractionService = new JobRequirementsExtractionService(
        inferenceProvider,
        logger
    );

    const directMatchingService: IJobRequirementDirectMatchingService = new JobRequirementDirectMatchingService(
        inferenceProvider,
        logger
    );
    const transferableMatchingService: IJobRequirementTransferableMatchingService =
        new JobRequirementTransferableMatchingService(inferenceProvider, logger);
    const jobRequirementMatchMapper: IJobRequirementMatchMapper = new JobRequirementMatchMapper();
    const requirementsMatchingService: IJobRequirementsMatchingService = new JobRequirementsMatchingService(
        directMatchingService,
        transferableMatchingService,
        jobRequirementMatchMapper,
        logger
    );


    const scoreCalculator: IJobMatchScoreCalculator = new JobMatchScoreCalculator();

    const jobAssessmentPipeline = new PipelineRunner<IJobAssessmentContext>([
        new ScreenJob(screeningService),
        new ExtractJobRequirements(requirementsExtractionService),
        new MatchJobRequirements(requirementsMatchingService),
        new CalculateJobMatchScore(scoreCalculator),
    ]);
    const jobAssessmentService: IJobAssessmentService = new JobAssessmentService(
        jobCandidateProfileRepo,
        jobAssessmentPipeline,
        jobPostRepository,
        jobAssessmentRepo,
        logger
    );

    const jobAssessmentQueueService: IJobAssessmentQueueService = new JobAssessmentQueueService(jobAssessmentQueue);

    const jobAssessmentQueueWorkerService: IJobAssessmentQueueWorkerService = new JobAssessmentQueueWorkerService(
        jobAssessmentQueue,
        jobAssessmentService,
        logger
    );

    const ingestionServiceBaseUrl = getIngestionServiceBaseUrlOrThrow();
    const ingestionGateway: IIngestionServiceGateway = new IngestionServiceGateway(ingestionServiceBaseUrl, logger);
    const jobSourceGateway: IJobSourceGateway = new JobSourceGateway(ingestionServiceBaseUrl, logger);

    const jobApplicationService: IJobApplicationService = new JobApplicationService(
        jobApplicationRepository,
        fileSystemRepository,
        logger
    );

    
    const jobPostGateway: IJobPostGateway = new JobPostGateway(ingestionServiceBaseUrl, logger);
    const jobPostService: IJobPostService = new JobPostService(jobPostGateway, logger);

    logger.debug("[buildDependencies] Application dependencies initialized");

    logger.debug(`[buildDependencies] Using DB Path: ${sqliteConnection.db.name}`);

    /**
     * Humble and basic DI until a proper DI framework is introduced.
     */
    return {
        logger,
        sqliteConnection,
        inferenceProvider,
        jobPostRepository,
        jobCandidateProfileService,
        jobPostService,
        jobAssessmentQueue,
        jobAssessmentQueueService,
        screeningService,
        requirementsExtractionService,
        requirementsMatchingService,
        jobAssessmentService,
        jobAssessmentQueueWorkerService,
        jobApplicationService,
        ingestionGateway,
        jobSourceGateway,
    };
}

function createSqliteConnection(): SqliteDatabaseConnection {
    const dbPath = process.env.DB_PATH;

    if (!dbPath) {
        throw new Error("DB_PATH environment variable is not set.");
    }

    return new SqliteDatabaseConnection(dbPath);
}

function getDataDirectory(): string {
    const dbPath = process.env.DB_PATH;

    if (!dbPath) {
        throw new Error("DB_PATH environment variable is not set.");
    }

    return path.dirname(dbPath);
}


function getIngestionServiceBaseUrlOrThrow(): string {
    const ingestionServiceBaseUrl = process.env.INGESTION_SVC_BASE_URL;

    if (!ingestionServiceBaseUrl) {
        throw new Error("INGESTION_SVC_BASE_URL environment variable is not set.");
    }

    return new URL(ingestionServiceBaseUrl).toString();
}