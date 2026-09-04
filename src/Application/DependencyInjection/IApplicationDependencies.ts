import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { ILlmInferenceProvider } from "../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabase";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { IJobAssessmentService } from "../JobAssessment/IJobAssessmentService";
import { IJobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/IJobRequirementMatchingService";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { IJobRequirementClassificationService } from "../JobAssessment/RquirementClassification/IJobRequirementClassificationService";
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { IJobPostService } from "../JobPost/IJobPostService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { IJobPostSyncService } from "../JobPostSync/IJobPostSyncService";

export interface IApplicationDependencies {
    jobAssessmentService: IJobAssessmentService;
    logger: ILogger;
    sqlite: SqliteDatabase;
    jobPostRepository: IJobPostRepository;
    jobSourceRepository: IJobSourceRepository;
    jobPostService: IJobPostService;
    jobPostSyncService: IJobPostSyncService;
    // TODO: Move to db
    jobCandidateProfile: ICandidateProfile;
    llm: ILlmInferenceProvider;
    screeningService: IJobScreeningService;
    requirementsExtractionService: IJobRequirementsExtractionService;
    requirementsClassificationService: IJobRequirementClassificationService;
    requirementsMatchingService: IJobRequirementsMatchingService;
    jobPostDiscoveryServiceFactory: IJobPostDiscoveryServiceFactory;
}
