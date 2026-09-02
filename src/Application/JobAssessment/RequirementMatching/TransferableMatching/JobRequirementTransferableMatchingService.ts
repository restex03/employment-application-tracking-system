import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { ILlmInferenceProvider } from "../../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../../Infrastructure/Logging/ILogger";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementTransferableMatch } from "./IJobRequirementTransferableMatch";
import { IJobRequirementTransferableMatchingService } from "./IJobRequirementTransferableMatchingService";
import { JobRequirementTransferableMatchingSystemPrompt } from "./JobRequirementTransferableMatchingSystemPrompt";
import { JobRequirementTransferableMatchResponseSchema } from "./JobRequirementTransferableMatchResponseSchema";
import {
    JobRequirementTransferableMatchResponse,
    JobRequirementTransferableMatchResponseValidationSchema,
} from "./JobRequirementTransferableMatchResponseValidationSchema";

export class JobRequirementTransferableMatchingService implements IJobRequirementTransferableMatchingService {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger
    ) {}

    public async assess(
        requirement: IClassifiedJobRequirement,
        profile: ICandidateProfile
    ): Promise<IJobRequirementTransferableMatch> {
        this.logger.info(`[JobRequirementTransferableMatchingService.assess] Assessing: ${requirement.area}`);

        const result = await this.llm.generateStructured<JobRequirementTransferableMatchResponse>({
            systemPrompt: JobRequirementTransferableMatchingSystemPrompt,
            input: {
                requirement,
                profile,
            },
            schemaName: "job_requirement_transferable_match",
            jsonSchema: JobRequirementTransferableMatchResponseSchema,
            validationSchema: JobRequirementTransferableMatchResponseValidationSchema,
            temperature: 0.1,
            maxTokens: 150,
        });

        if (result.isTransferableMatch && !result.evidence) {
            throw new Error(`Transferable match requires evidence: ${requirement.area}`);
        }

        if (!result.isTransferableMatch && result.evidence !== null) {
            throw new Error(`Non-transferable match must not contain evidence: ${requirement.area}`);
        }

        return {
            requirement,
            isTransferableMatch: result.isTransferableMatch,
            evidence: result.evidence,
        };
    }
}
