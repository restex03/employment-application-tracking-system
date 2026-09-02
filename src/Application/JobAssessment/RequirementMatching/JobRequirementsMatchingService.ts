import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { PipelineStepStatus } from "../../Pipelines/IPipelineStepResult";
import { PipelineRunner } from "../../Pipelines/PipelineRunner";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatchingService } from "./DirectMatching/IJobRequirementDirectMatchingService";
import { IJobRequirementMatch } from "./IJobRequirementMatch";
import { IJobRequirementsMatchingService } from "./IJobRequirementMatchingService";
import { JobRequirementMatchMapper } from "./Mappers/JobRequirementMatchMapper";
import { AssessDirectMatch } from "./Pipeline/Steps/AssessDirectMatch";
import { AssessTransferableMatch } from "./Pipeline/Steps/AssessTransferableMatch";
import { IJobRequirementMatchingContext } from "./Pipeline/Steps/IJobRequirementMatchingContext";
import { MapRequirementMatch } from "./Pipeline/Steps/MapRequirementMatch";
import { IJobRequirementTransferableMatchingService } from "./TransferableMatching/IJobRequirementTransferableMatchingService";

export class JobRequirementsMatchingService implements IJobRequirementsMatchingService {
    private readonly requirementMatchingPipeline: PipelineRunner<IJobRequirementMatchingContext>;

    constructor(
        directMatchingService: IJobRequirementDirectMatchingService,
        transferableMatchingService: IJobRequirementTransferableMatchingService,
        mapper: JobRequirementMatchMapper,
        private readonly logger: ILogger
    ) {
        this.requirementMatchingPipeline = new PipelineRunner<IJobRequirementMatchingContext>([
            new AssessDirectMatch(directMatchingService),
            new AssessTransferableMatch(transferableMatchingService),
            new MapRequirementMatch(mapper),
        ]);
    }

    public async match(
        requirements: IClassifiedJobRequirement[],
        profile: ICandidateProfile
    ): Promise<IJobRequirementMatch[]> {
        this.logger.info(`[JobRequirementsMatchingService.match] Matching ${requirements.length} requirements`);

        const matches: IJobRequirementMatch[] = [];

        for (const requirement of requirements) {
            const match = await this.matchSingle(requirement, profile);
            matches.push(match);
        }

        this.logger.info(`[JobRequirementsMatchingService.match] Completed matching ${matches.length} requirements`);

        return matches;
    }

    public async matchSingle(
        requirement: IClassifiedJobRequirement,
        profile: ICandidateProfile
    ): Promise<IJobRequirementMatch> {
        this.logger.info(`[JobRequirementsMatchingService.matchSingle] Matching: ${requirement.area}`);

        const context: IJobRequirementMatchingContext = {
            requirement,
            profile,
        };

        const result = await this.requirementMatchingPipeline.run(context);

        if (result.status === PipelineStepStatus.Failed) {
            const step = result.failedStep ? ` at ${result.failedStep}` : "";

            const reason = result.reason ?? `Requirement matching failed for ${requirement.area}`;

            this.logger.error(`[JobRequirementsMatchingService.matchSingle] Failed${step}: ${reason}`);

            throw new Error(`Requirement matching failed${step}: ${reason}`);
        }

        if (!context.match) {
            const reason = `Requirement matching produced no match: ${requirement.area}`;

            this.logger.error(`[JobRequirementsMatchingService.matchSingle] ${reason}`);

            throw new Error(reason);
        }

        this.logMatch(context.match);

        return context.match;
    }

    private logMatch(match: IJobRequirementMatch): void {
        this.logger.info(`\t- ${match.requirement.area}`);
        this.logger.info(`\t\t- Match: ${match.matchType}`);

        if (match.evidence) {
            this.logger.info(`\t\t- Evidence: ${match.evidence}`);
        }
    }
}
