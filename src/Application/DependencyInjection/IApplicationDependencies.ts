import { ILlmInferenceProvider } from "../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { IJobAssessmentService } from "../JobAssessment/IJobAssessmentService";
import { IJobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/IJobRequirementMatchingService";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { IJobRequirementClassificationService } from "../JobAssessment/RquirementClassification/IJobRequirementClassificationService";
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { IJobCandidateProfileService } from "../JobCandidateProfiles/IJobCandidateProfileService";
import { IJobPostResultService } from "../JobPost/IJobPostResultService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { IJobPostSyncService } from "../JobPostSync/IJobPostSyncService";
import { IJobSourceService } from "../JobSources/IJobSourceService";

export interface IApplicationDependencies {
    jobAssessmentService: IJobAssessmentService;
    logger: ILogger;
    sqliteConnection: SqliteDatabaseConnection;
    jobPostRepository: IJobPostRepository;
    jobSourceRepository: IJobSourceRepository;
    jobPostResultService: IJobPostResultService;
    jobPostSyncService: IJobPostSyncService;
    jobCandidateProfileService: IJobCandidateProfileService;
    jobSourceService: IJobSourceService;
    llm: ILlmInferenceProvider;
    screeningService: IJobScreeningService;
    requirementsExtractionService: IJobRequirementsExtractionService;
    requirementsClassificationService: IJobRequirementClassificationService;
    requirementsMatchingService: IJobRequirementsMatchingService;
    jobPostDiscoveryServiceFactory: IJobPostDiscoveryServiceFactory;
}
