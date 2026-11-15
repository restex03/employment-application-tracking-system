import { Module } from "@nestjs/common";
import { JobAssessmentService } from "../../Application/JobAssessment/JobAssessmentService";
import { IJobAssessmentContext } from "../../Application/JobAssessment/Pipeline/IJobAssessmentContext";
import { CalculateJobMatchScore } from "../../Application/JobAssessment/Pipeline/Steps/CalculateJobMatchScore";
import { ExtractJobRequirements } from "../../Application/JobAssessment/Pipeline/Steps/ExtractJobRequirements";
import { MatchJobRequirements } from "../../Application/JobAssessment/Pipeline/Steps/MatchJobRequirements";
import { ScreenJob } from "../../Application/JobAssessment/Pipeline/Steps/ScreenJob";
import { JobAssessmentQueueService } from "../../Application/JobAssessment/PipelineQueue/JobAssessmentQueueService";
import { JobAssessmentQueueWorkerService } from "../../Application/JobAssessment/PipelineQueue/JobAssessmentQueueWorkerService";
import { IJobAssessmentQueueWorkerService } from "../../Application/JobAssessment/PipelineQueue/IJobAssessmentQueueWorkerService";
import { JobRequirementDirectMatchingService } from "../../Application/JobAssessment/RequirementMatching/DirectMatching/JobRequirementDirectMatchingService";
import { JobRequirementMatchMapper } from "../../Application/JobAssessment/RequirementMatching/Mappers/JobRequirementMatchMapper";
import { JobRequirementsMatchingService } from "../../Application/JobAssessment/RequirementMatching/JobRequirementsMatchingService";
import { JobRequirementTransferableMatchingService } from "../../Application/JobAssessment/RequirementMatching/TransferableMatching/JobRequirementTransferableMatchingService";
import { JobRequirementsExtractionService } from "../../Application/JobAssessment/RequirementsExtraction/JobRequirementsExtractionService";
import { IJobRequirementsExtractionService } from "../../Application/JobAssessment/RequirementsExtraction/IJobRequirementsExtractionService";
import { JobScreeningService } from "../../Application/JobAssessment/Screening/Ollama/JobScreeningService";
import { IJobScreeningService } from "../../Application/JobAssessment/Screening/IJobScreeningService";
import { PipelineRunner } from "../../Application/Pipelines/PipelineRunner";
import { JobMatchScoreCalculator } from "../../Domain/JobAssessment/Scoring/JobMatchScoreCalculator";
import { GenerateStructuredRetryStrategyProvider } from "../../Infrastructure/Inference/OpenAi/InferenceRetries/GenerateStructuredRetryStrategyProvider";
import { LlmTargetRegistry } from "../../Infrastructure/Inference/OpenAi/LlmTargetRegistry/LlmTargetRegistry";
import { OpenAiInferenceProvider } from "../../Infrastructure/Inference/OpenAi/OpenAiInferenceProvider";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { TOKENS } from "../../DependencyInjection/tokens";
import { JobAssessmentsController } from "../Controllers/JobAssessmentsController";
import { QueueJobsController } from "../Controllers/QueueJobsController";

@Module({
    imports: [InfrastructureModule],
    controllers: [JobAssessmentsController, QueueJobsController],
    providers: [
        {
            provide: TOKENS.inferenceProvider,
            inject: [TOKENS.logger],
            useFactory: logger =>
                new OpenAiInferenceProvider(
                    logger,
                    LlmTargetRegistry.Mistral_Medium_3_5_hosted,
                    new GenerateStructuredRetryStrategyProvider()
                ),
        },
        {
            provide: TOKENS.screeningService,
            inject: [TOKENS.inferenceProvider, TOKENS.logger],
            useFactory: (inference, logger): IJobScreeningService => new JobScreeningService(inference, logger),
        },
        {
            provide: TOKENS.requirementsExtractionService,
            inject: [TOKENS.inferenceProvider, TOKENS.logger],
            useFactory: (inference, logger): IJobRequirementsExtractionService =>
                new JobRequirementsExtractionService(inference, logger),
        },
        {
            provide: TOKENS.directMatchingService,
            inject: [TOKENS.inferenceProvider, TOKENS.logger],
            useFactory: (inference, logger) => new JobRequirementDirectMatchingService(inference, logger),
        },
        {
            provide: TOKENS.transferableMatchingService,
            inject: [TOKENS.inferenceProvider, TOKENS.logger],
            useFactory: (inference, logger) => new JobRequirementTransferableMatchingService(inference, logger),
        },
        {
            provide: TOKENS.requirementMatchMapper,
            useClass: JobRequirementMatchMapper,
        },
        {
            provide: TOKENS.requirementsMatchingService,
            inject: [
                TOKENS.directMatchingService,
                TOKENS.transferableMatchingService,
                TOKENS.requirementMatchMapper,
                TOKENS.logger,
            ],
            useFactory: (direct, transferable, mapper, logger) =>
                new JobRequirementsMatchingService(direct, transferable, mapper, logger),
        },
        {
            provide: TOKENS.matchScoreCalculator,
            useClass: JobMatchScoreCalculator,
        },
        {
            provide: PipelineRunner<IJobAssessmentContext>,
            inject: [
                TOKENS.screeningService,
                TOKENS.requirementsExtractionService,
                TOKENS.requirementsMatchingService,
                TOKENS.matchScoreCalculator,
            ],
            useFactory: (screening, extraction, matching, scoreCalculator) =>
                new PipelineRunner<IJobAssessmentContext>([
                    new ScreenJob(screening),
                    new ExtractJobRequirements(extraction),
                    new MatchJobRequirements(matching),
                    new CalculateJobMatchScore(scoreCalculator),
                ]),
        },
        {
            provide: TOKENS.jobAssessmentService,
            inject: [
                TOKENS.candidateProfileRepository,
                PipelineRunner<IJobAssessmentContext>,
                TOKENS.jobPostGateway,
                TOKENS.jobAssessmentRepository,
                TOKENS.logger,
            ],
            useFactory: (profileRepository, pipeline, postGateway, assessmentRepository, logger) =>
                new JobAssessmentService(profileRepository, pipeline, postGateway, assessmentRepository, logger),
        },
        {
            provide: TOKENS.jobAssessmentQueueService,
            inject: [TOKENS.jobAssessmentQueue],
            useFactory: queue => new JobAssessmentQueueService(queue),
        },
        {
            provide: TOKENS.jobAssessmentQueueWorkerService,
            inject: [TOKENS.jobAssessmentQueue, TOKENS.jobAssessmentService, TOKENS.logger],
            useFactory: (queue, assessment, logger): IJobAssessmentQueueWorkerService =>
                new JobAssessmentQueueWorkerService(queue, assessment, logger),
        },
    ],
    exports: [TOKENS.jobAssessmentService, TOKENS.jobAssessmentQueueService, TOKENS.jobAssessmentQueueWorkerService],
})
export class AssessmentsModule {}
