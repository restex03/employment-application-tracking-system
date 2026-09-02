import { IPipelineStep } from "../../../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../../../Pipelines/IPipelineStepResult";
import { JobRequirementMatchMapper } from "../../../Mappers/JobRequirementMatchMapper";
import { IJobRequirementMatchingContext } from "../../IJobRequirementMatchingContext";

export class MapRequirementMatch implements IPipelineStep<IJobRequirementMatchingContext> {
    constructor(private readonly mapper: JobRequirementMatchMapper) {}

    public async execute(context: IJobRequirementMatchingContext): Promise<IPipelineStepResult> {
        if (!context.directMatch) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Direct match assessment is missing.",
            };
        }

        if (context.directMatch.requirement !== context.requirement) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Direct match requirement does not match context requirement.",
            };
        }

        if (context.transferableMatch && context.transferableMatch.requirement !== context.requirement) {
            return {
                status: PipelineStepStatus.Failed,
                reason: "Transferable match requirement does not match context requirement.",
            };
        }

        try {
            context.match = this.mapper.map(context.directMatch, context.transferableMatch);

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
