import { IPipelineStep } from "../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../Pipelines/IPipelineStepResult";
import { IJobRequirementsExtractionService } from "../../RequirementsExtraction/IJobRequirementsExtractionService";

import { IJobAssessmentContext } from "../IJobAssessmentContext";

export class ExtractJobRequirements implements IPipelineStep<IJobAssessmentContext> {
    constructor(private readonly requirementsSvc: IJobRequirementsExtractionService) {}

    public async execute(context: IJobAssessmentContext): Promise<IPipelineStepResult> {
        if (!context.jobDetail) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Job details are required before extracting job requirements.",
            };
        }

        try {
            context.requirements = await this.requirementsSvc.extract(context.jobDetail);

            return {
                status: PipelineStepStatus.Succeeded,
            };
        } catch (error) {
            return {
                status: PipelineStepStatus.Failed,
                reason: error instanceof Error ? error.message : "Failed to extract job requirements.",
            };
        }
    }
}
