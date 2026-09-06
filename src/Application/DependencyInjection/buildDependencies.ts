import { SqliteJobRepository } from "../../Infrastructure/Persistence/JobPost/Sqlite/Repositories/SqliteJobRepository";
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
import { IJobPostService } from "../JobPost/IJobPostService";
import { JobPostService } from "../JobPost/JobPostService";
import { WorkdayJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/Workday/WorkdayJobSourceRepository";
import { IApplicationDependencies } from "./IApplicationDependencies";
import { IJobPostSyncService } from "../JobPostSync/IJobPostSyncService";
import { JobPostSyncService } from "../JobPostSync/JobPostSyncService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { JobPostDiscoveryServiceFactory } from "../JobPostDiscovery/JobPostDiscoveryServiceFactory";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { IJobAssessmentService } from "../JobAssessment/IJobAssessmentService";
import { JobAssessmentService } from "../JobAssessment/JobAssessmentService";
import { readFileSync } from "fs";
import { ScreenJob } from "../JobAssessment/Pipeline/Steps/ScreenJob";
import { IJobAssessmentContext } from "../JobAssessment/Pipeline/IJobAssessmentContext";
import { ClassifyJobRequirements } from "../JobAssessment/Pipeline/Steps/ClassifyJobRequirements";
import { ExtractJobRequirements } from "../JobAssessment/Pipeline/Steps/ExtractJobRequirements";
import { FetchJobDetails } from "../JobAssessment/Pipeline/Steps/FetchJobDetail";
import { MatchJobRequirements } from "../JobAssessment/Pipeline/Steps/MatchJobRequirements";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { JobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/JobCandidateProfileRepository";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { IJobCandidateProfileService } from "../JobCandidateProfiles/IJobCandidateProfileService";
import { JobCandidateProfileService } from "../JobCandidateProfiles/JobCandidateProfileService";
import { IJobSourceService } from "../JobSources/IJobSourceService";
import { JobSourceService } from "../JobSources/JobSourceService";
import { CalculateJobMatchScore } from "../JobAssessment/Pipeline/Steps/CalculateJobScore";
import { JobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/JobMatchScoreCalculator";
import { IJobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/IJobMatchScoreCalculator";
import { IJobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/IJobAssessmentRepository";
import { JobAssessmentRepository } from "../../Infrastructure/Persistence/JobAssessments/JobAssessmentRepository";

export function buildDependencies(logLevel: LogLevel): IApplicationDependencies {
    const logger: ILogger = new ConsoleLogger(logLevel);

    /*
     * Persistence
     */
    const sqliteConnection = createSqliteConnection();

    const jobPostRepository: IJobPostRepository = new SqliteJobRepository(sqliteConnection.db, logger);

    const jobSourceRepository: IJobSourceRepository = new WorkdayJobSourceRepository(sqliteConnection.db, logger);

    const jobSourceService: IJobSourceService = new JobSourceService(jobSourceRepository, logger);

    const jobCandidateProfileRepo: IJobCandidateProfileRepository = new JobCandidateProfileRepository(
        sqliteConnection.db,
        logger
    );
    const jobCandidateProfileService: IJobCandidateProfileService = new JobCandidateProfileService(
        jobCandidateProfileRepo,
        logger
    );

    const jobAssessmentRepo: IJobAssessmentRepository = new JobAssessmentRepository(sqliteConnection.db, logger);

    /*
     * Inference
     */
    const llm: ILlmInferenceProvider = new OllamaInferenceProvider(logger);

    /*
     * Job post services
     */
    const jobPostService: IJobPostService = new JobPostService(jobPostRepository, logger);

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
        jobPostService,
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
    logger.debug("[buildDependencies] Application dependencies initialized");

    logger.debug(`[buildDependencies] Using DB Path: ${sqliteConnection.db.name}`);

    return {
        logger,
        sqliteConnection,
        llm,
        jobPostRepository,
        jobSourceRepository,
        jobSourceService,
        jobCandidateProfileService,
        jobPostService,
        jobPostSyncService,

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
