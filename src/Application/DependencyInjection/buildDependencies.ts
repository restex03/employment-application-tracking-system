import { SqliteJobRepository } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteJobRepository";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { ConsoleLogger } from "../../Infrastructure/Logging/Console/ConsoleLogger";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { LogLevel } from "../../Infrastructure/Logging/LogLevel";
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
import { SqliteJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/Sqlite/SqliteJobSourceRepository";
import { IApplicationDependencies } from "./IApplicationDependencies";
import { IJobPostSyncService } from "../JobPostSync/IJobPostSyncService";
import { JobPostSyncService } from "../JobPostSync/JobPostSyncService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { JobPostDiscoveryServiceFactory } from "../JobPostDiscovery/JobPostDiscoveryServiceFactory";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { IJobAssessmentService } from "../JobAssessment/IJobAssessmentService";
import { JobAssessmentService } from "../JobAssessment/JobAssessmentService";
import { ScreenJob } from "../JobAssessment/Pipeline/Steps/ScreenJob";
import { IJobAssessmentContext } from "../JobAssessment/Pipeline/IJobAssessmentContext";
import { ClassifyJobRequirements } from "../JobAssessment/Pipeline/Steps/ClassifyJobRequirements";
import { ExtractJobRequirements } from "../JobAssessment/Pipeline/Steps/ExtractJobRequirements";
import { FetchJobDetails } from "../JobAssessment/Pipeline/Steps/FetchJobDetail";
import { MatchJobRequirements } from "../JobAssessment/Pipeline/Steps/MatchJobRequirements";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { SqliteJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/Sqlite/SqliteJobCandidateProfileRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { IJobCandidateProfileService } from "../JobCandidateProfiles/IJobCandidateProfileService";
import { JobCandidateProfileService } from "../JobCandidateProfiles/JobCandidateProfileService";
import { IJobSourceService } from "../JobSources/IJobSourceService";
import { JobSourceService } from "../JobSources/Workday/JobSourceService";
import { CalculateJobMatchScore } from "../JobAssessment/Pipeline/Steps/CalculateJobMatchScore";
import { JobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/JobMatchScoreCalculator";
import { IJobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/IJobMatchScoreCalculator";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { SqliteJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/Sqlite/SqliteJobAssessmentRepository";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";
import { SqliteJobQueries } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteJobQueries";
import { IJobPostResultService } from "../JobPost/IJobPostResultService";
import { JobPostResultService } from "../JobPost/JobPostResultService";
import { JobAssessmentQueueService } from "../JobAssessment/PipelineQueue/JobAssessmentQueueService";
import { IJobAssessmentQueueService } from "../JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { IJobAssessmentQueue } from "../../Infrastructure/Persistence/JobAssessmentQueue/IJobAssessmentQueue";
import { SqliteJobAssessmentQueueRepository } from "../../Infrastructure/Persistence/JobAssessmentQueue/Sqlite/SqliteJobAssessmentQueueRepository";

export function buildDependencies(logLevel: LogLevel): IApplicationDependencies {
    const logger: ILogger = new ConsoleLogger(logLevel);

    /*
     * Persistence
     */
    const sqliteConnection = createSqliteConnection();

    const jobPostRepository: IJobPostRepository = new SqliteJobRepository(sqliteConnection.db, logger);

    const jobSourceRepository: IJobSourceRepository = new SqliteJobSourceRepository(sqliteConnection.db, logger);

    const jobSourceService: IJobSourceService = new JobSourceService(jobSourceRepository, logger);

    const jobCandidateProfileRepo: IJobCandidateProfileRepository = new SqliteJobCandidateProfileRepository(
        sqliteConnection.db,
        logger
    );
    const jobCandidateProfileService: IJobCandidateProfileService = new JobCandidateProfileService(
        jobCandidateProfileRepo,
        logger
    );

    const jobAssessmentRepo: IJobAssessmentRepository = new SqliteJobAssessmentRepository(sqliteConnection.db, logger);

    const jobPostQueries: IJobPostQueries = new SqliteJobQueries(sqliteConnection.db, logger);
    const jobAssessmentQueue: IJobAssessmentQueue = new SqliteJobAssessmentQueueRepository(sqliteConnection.db, logger);

    /*
     * Inference
     */
    const llm: ILlmInferenceProvider = new OllamaInferenceProvider(logger);

    /*
     * Job post services
     */
    const jobPostResultService: IJobPostResultService = new JobPostResultService(
        jobPostRepository,
        jobPostQueries,
        logger
    );

    /*
     * Assessment services
     */
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
    const jobPostDiscoveryServiceFactory: IJobPostDiscoveryServiceFactory = new JobPostDiscoveryServiceFactory(logger);

    /*
     * Job synchronization
     */
    const jobPostSyncService: IJobPostSyncService = new JobPostSyncService(
        jobPostDiscoveryServiceFactory,
        jobSourceRepository,
        jobPostRepository,
        logger
    );
    const scoreCalculator: IJobMatchScoreCalculator = new JobMatchScoreCalculator();
    const jobAssessmentPipeline = new PipelineRunner<IJobAssessmentContext>([
        new ScreenJob(screeningService),
        new FetchJobDetails(jobPostDiscoveryServiceFactory),
        new ExtractJobRequirements(requirementsExtractionService),
        new ClassifyJobRequirements(requirementsClassificationService),
        new MatchJobRequirements(requirementsMatchingService),
        new CalculateJobMatchScore(scoreCalculator),
    ]);
    const jobAssessmentService: IJobAssessmentService = new JobAssessmentService(
        jobCandidateProfileRepo,
        jobAssessmentPipeline,
        jobSourceRepository,
        jobPostRepository,
        jobAssessmentRepo,
        logger
    );

    const jobAssessmentQueueService: IJobAssessmentQueueService = new JobAssessmentQueueService(
        jobAssessmentQueue,
        jobAssessmentService
    );
    logger.debug("[buildDependencies] Application dependencies initialized");

    logger.debug(`[buildDependencies] Using DB Path: ${sqliteConnection.db.name}`);

    /**
     * Humble and basic DI until a proper DI framework is introduced.
     */
    return {
        logger,
        sqliteConnection,
        llm,
        jobPostRepository,
        jobSourceRepository,
        jobSourceService,
        jobCandidateProfileService,
        jobPostResultService,
        jobPostSyncService,
        jobAssessmentQueue,
        jobAssessmentQueueService,
        screeningService,
        requirementsExtractionService,
        requirementsClassificationService,
        requirementsMatchingService,
        jobPostDiscoveryServiceFactory,
        jobAssessmentService,
    };
}

function createSqliteConnection(): SqliteDatabaseConnection {
    const dbPath = process.env.DB_PATH;

    if (!dbPath) {
        throw new Error("DB_PATH environment variable is not set.");
    }

    return new SqliteDatabaseConnection(dbPath);
}
