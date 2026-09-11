import { IPipelineStep } from "../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../Pipelines/IPipelineStepResult";
import { IJobScreeningService } from "../../Screening/IJobScreeningService";
import { IJobAssessmentContext } from "../IJobAssessmentContext";
import { CalculateJobMatchScore } from "./CalculateJobMatchScore";

export class ScreenJob implements IPipelineStep<IJobAssessmentContext> {
    constructor(private readonly screeningSvc: IJobScreeningService) {}

    public async execute(context: IJobAssessmentContext): Promise<IPipelineStepResult> {
        try {
            const result = await this.screeningSvc.screen(context.job);

            context.screenResult = result;

            if (result.disposition === "reject") {
                return {
                    status: PipelineStepStatus.Jumped,
                    jumpStep: CalculateJobMatchScore.name,
                    reason: result.reason,
                };
            }

            return {
                status: PipelineStepStatus.Succeeded,
            };
        } catch (error) {
            return {
                status: PipelineStepStatus.Failed,
                reason: error instanceof Error ? error.message : "Failed to screen job.",
            };
        }
    }
}
