import { IPipelineStep } from "../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../Pipelines/IPipelineStepResult";
import { IJobRequirementsMatchingService } from "../../RequirementMatching/IJobRequirementMatchingService";

import { IJobAssessmentContext } from "../IJobAssessmentContext";

export class MatchJobRequirements implements IPipelineStep<IJobAssessmentContext> {
    constructor(private readonly matchingSvc: IJobRequirementsMatchingService) {}

    public async execute(context: IJobAssessmentContext): Promise<IPipelineStepResult> {
        if (!context.requirements) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Job requirements are required before matching.",
            };
        }

        if (!context.candidateProfile) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Candidate profile is required before matching job requirements.",
            };
        }

        try {
            context.requirementMatches = await this.matchingSvc.match(
                context.requirements,
                context.candidateProfile
            );

            return {
                status: PipelineStepStatus.Succeeded,
            };
        } catch (error) {
            return {
                status: PipelineStepStatus.Failed,
                reason: error instanceof Error ? error.message : "Failed to match job requirements.",
            };
        }
    }
}
