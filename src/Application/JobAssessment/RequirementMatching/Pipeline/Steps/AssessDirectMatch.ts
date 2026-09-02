import { IPipelineStep } from "../../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../../Pipelines/IPipelineStepResult";
import { IJobRequirementDirectMatchingService } from "../../DirectMatching/IJobRequirementDirectMatchingService";
import { IJobRequirementMatchingContext } from "./IJobRequirementMatchingContext";

export class AssessDirectMatch implements IPipelineStep<IJobRequirementMatchingContext> {
    constructor(private readonly directMatchingService: IJobRequirementDirectMatchingService) {}

    public async execute(context: IJobRequirementMatchingContext): Promise<IPipelineStepResult> {
        try {
            context.directMatch = await this.directMatchingService.assess(context.requirement, context.profile);

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
