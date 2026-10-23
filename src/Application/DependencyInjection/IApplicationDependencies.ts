import { ILlmInferenceProvider } from "../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { IJobAssessmentQueue } from "../../Infrastructure/Persistence/Queues/JobAssessmentQueue/IJobAssessmentQueue";
import { IIngestionServiceGateway } from "../../Infrastructure/Ingestion/IIngestionServiceGateway";
import { IJobApplicationService } from "../JobApplications/IJobApplicationService";
import { IJobAssessmentService } from "../JobAssessment/IJobAssessmentService";
import { IJobAssessmentQueueService } from "../JobAssessment/PipelineQueue/IJobAssessmentQueueService";
import { IJobAssessmentQueueWorkerService } from "../JobAssessment/PipelineQueue/IJobAssessmentQueueWorkerService";
import { IJobRequirementsMatchingService } from "../JobAssessment/RequirementMatching/IJobRequirementMatchingService";
import { IJobRequirementsExtractionService } from "../JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { IJobScreeningService } from "../JobAssessment/Screening/IJobScreeningService";
import { IJobCandidateProfileService } from "../JobCandidateProfiles/IJobCandidateProfileService";
import { IJobPostService } from "../JobPost/IJobPostService";
import { IJobSourceGateway } from "../../Infrastructure/JobSourcing/IJobSourceGateway";

export interface IApplicationDependencies {
    jobAssessmentService: IJobAssessmentService;
    logger: ILogger;
    sqliteConnection: SqliteDatabaseConnection;
    jobPostRepository: IJobPostRepository;
    jobPostService: IJobPostService;
    jobAssessmentQueue: IJobAssessmentQueue;
    jobAssessmentQueueService: IJobAssessmentQueueService;
    jobCandidateProfileService: IJobCandidateProfileService;
    inferenceProvider: ILlmInferenceProvider;
    screeningService: IJobScreeningService;
    requirementsExtractionService: IJobRequirementsExtractionService;
    requirementsMatchingService: IJobRequirementsMatchingService;
    jobAssessmentQueueWorkerService: IJobAssessmentQueueWorkerService;
    jobApplicationService: IJobApplicationService;
    ingestionGateway: IIngestionServiceGateway;
    jobSourceGateway: IJobSourceGateway;
}
