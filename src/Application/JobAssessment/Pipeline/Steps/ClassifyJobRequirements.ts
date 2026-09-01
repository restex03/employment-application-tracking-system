import { IPipelineStep } from "../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../Pipelines/IPipelineStepResult";
import { IJobRequirementClassificationService } from "../../RquirementClassification/IJobRequirementClassificationService";
import { IJobAssessmentContext } from "../IJobAssessmentContext";

export class ClassifyJobRequirements implements IPipelineStep<IJobAssessmentContext> {
    constructor(private readonly classificationSvc: IJobRequirementClassificationService) {}

    public async execute(context: IJobAssessmentContext): Promise<IPipelineStepResult> {
        if (!context.requirements) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Job requirements are required before classification.",
            };
        }
        if (!Array.isArray(context.requirements)) {
            return {
                status: PipelineStepStatus.Failed,
                reason: `Pipeline step received requirements that are not array: ${JSON.stringify(context.requirements, null, 2)}`,
            };
        }

        try {
            context.classifiedRequirements = await this.classificationSvc.classify(context.requirements);

            return {
                status: PipelineStepStatus.Succeeded,
            };
        } catch (error) {
            return {
                status: PipelineStepStatus.Failed,
                reason: error instanceof Error ? error.message : "Failed to classify job requirements.",
            };
        }
    }
}
