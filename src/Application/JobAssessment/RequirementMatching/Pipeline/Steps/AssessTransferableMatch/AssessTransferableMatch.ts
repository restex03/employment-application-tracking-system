import { IPipelineStep } from "../../../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../../../Pipelines/IPipelineStepResult";
import { IJobRequirementTransferableMatchingService } from "../../../TransferableMatching/IJobRequirementTransferableMatchingService";
import { IJobRequirementMatchingContext } from "../../IJobRequirementMatchingContext";

export class AssessTransferableMatch implements IPipelineStep<IJobRequirementMatchingContext> {
    constructor(private readonly transferableMatchingService: IJobRequirementTransferableMatchingService) {}

    public async execute(context: IJobRequirementMatchingContext): Promise<IPipelineStepResult> {
        if (!context.directMatch) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Direct match assessment is missing.",
            };
        }

        if (context.directMatch.isDirectMatch) {
            return {
                status: PipelineStepStatus.Succeeded,
            };
        }

        try {
            const transferableMatch = await this.transferableMatchingService.assess(
                context.requirement,
                context.profile
            );

            if (transferableMatch.requirement !== context.requirement) {
                return {
                    status: PipelineStepStatus.Failed,
                    reason: "Transferable match requirement does not match context requirement.",
                };
            }

            context.transferableMatch = transferableMatch;

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
