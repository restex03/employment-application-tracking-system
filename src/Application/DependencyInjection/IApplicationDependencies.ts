import { ILlmInferenceProvider } from "../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { SqliteDatabase } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabase";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository ";
import { IJobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/IJobRequirementMatchingService";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { IJobRequirementClassificationService } from "../JobAssessment/RquirementClassification/IJobRequirementClassificationService";
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { IJobPostService } from "../JobPost/IJobPostService";

export interface IApplicationDependencies {
    jobSourceRepository: IJobSourceRepository;
    logger: ILogger;
    sqlite: SqliteDatabase;
    llm: ILlmInferenceProvider;

    jobPostRepository: IJobPostRepository;
    jobPostService: IJobPostService;

    screeningService: IJobScreeningService;
    requirementsExtractionService: IJobRequirementsExtractionService;
    requirementsClassificationService: IJobRequirementClassificationService;
    requirementsMatchingService: IJobRequirementsMatchingService;
}
