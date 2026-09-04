import { SqliteJobRepository } from "../../Infrastructure/Persistence/JobPost/Sqlite/Repositories/SqliteJobRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabase";
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

export function buildDependencies(logLevel: LogLevel): IApplicationDependencies {
    const logger: ILogger = new ConsoleLogger(logLevel);

    /*
     * Persistence
     */
    const sqlite = createSqliteDatabase();

    const jobPostRepository: IJobPostRepository = new SqliteJobRepository(sqlite.connection, logger);

    const jobSourceRepository: IJobSourceRepository = new WorkdayJobSourceRepository(sqlite.connection, logger);

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
    const jobCandidateProfile: ICandidateProfile = readCandidateProfile();
    const jobAssessmentPipeline = new PipelineRunner<IJobAssessmentContext>([
        new ScreenJob(screeningService),
        new FetchJobDetails(jobPostDiscoveryServiceFactory),
        new ExtractJobRequirements(requirementsExtractionService),
        new ClassifyJobRequirements(requirementsClassificationService),
        new MatchJobRequirements(requirementsMatchingService),
    ]);
    const jobAssessmentService: IJobAssessmentService = new JobAssessmentService(
        jobCandidateProfile,
        jobAssessmentPipeline,
        jobSourceRepository,
        jobPostRepository,
        logger
    );
    logger.debug("[buildDependencies] Application dependencies initialized");

    logger.debug(`[buildDependencies] DB Connection Path: ${sqlite.connection.name}`);

    return {
        logger,
        sqlite,
        llm,
        jobCandidateProfile,
        jobPostRepository,
        jobSourceRepository,

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

function createSqliteDatabase(): SqliteDatabase {
    const dbPath = process.env.DB_PATH;

    if (!dbPath) {
        throw new Error("DB_PATH environment variable is not set.");
    }

    return new SqliteDatabase(dbPath);
}

function readCandidateProfile(): ICandidateProfile {
    const profilePath = process.env.CANDIDATE_PROFILE_PATH;
    if (!profilePath) {
        throw new Error("CANDIDATE_PROFILE_PATH environment variable is not set.");
    }
    console.log(`[buildDependencies] Reading candidate profile from: ${profilePath}`);
    const profileData = readFileSync(profilePath, "utf-8");
    return JSON.parse(profileData) as ICandidateProfile;
}
