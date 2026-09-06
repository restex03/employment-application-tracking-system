import { JobMatchScoreCalculator } from "../../../../Domain/JobAssessment/Scoring/JobMatchScoreCalculator";
import { IPipelineStep } from "../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../Pipelines/IPipelineStepResult";
import { IJobAssessmentContext } from "../IJobAssessmentContext";

export class CalculateJobMatchScore implements IPipelineStep<IJobAssessmentContext> {
    constructor(private readonly calculator: JobMatchScoreCalculator) {}

    public async execute(context: IJobAssessmentContext): Promise<IPipelineStepResult> {
        if (!context.requirementMatches) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Requirement matches are missing.",
            };
        }

        try {
            context.jobMatchScore = this.calculator.calculate(context.requirementMatches);

            return {
                status: PipelineStepStatus.Succeeded,
            };
        } catch (error) {
            return {
                status: PipelineStepStatus.Failed,
                reason: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
