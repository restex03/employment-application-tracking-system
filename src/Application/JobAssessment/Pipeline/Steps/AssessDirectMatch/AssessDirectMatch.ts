import { IPipelineStep } from "../../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../../Pipelines/IPipelineStepResult";
import { IJobRequirementDirectMatchingService } from "../../../RequirementMatching/DirectMatching/IJobRequirementDirectMatchingService";
import { IJobRequirementMatchingContext } from "../../../RequirementMatching/Pipeline/IJobRequirementMatchingContext";

export class AssessDirectMatch implements IPipelineStep<IJobRequirementMatchingContext> {
    constructor(private readonly directMatchingService: IJobRequirementDirectMatchingService) {}

    public async execute(context: IJobRequirementMatchingContext): Promise<IPipelineStepResult> {
        try {
            const directMatch = await this.directMatchingService.assess(context.requirement, context.profile);

            if (directMatch.requirement !== context.requirement) {
                return {
                    status: PipelineStepStatus.Failed,
                    reason: "Direct match requirement does not match context requirement.",
                };
            }

            context.directMatch = directMatch;

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
