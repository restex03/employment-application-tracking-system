import { ICandidateProfile } from "../../../../Domain/Candidates/ICandidateProfile";
import { ILlmInferenceProvider } from "../../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../../Infrastructure/Logging/ILogger";
import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementDirectMatch } from "./IJobRequirementDirectMatch";
import { IJobRequirementDirectMatchingService } from "./IJobRequirementDirectMatchingService";
import { JobRequirementDirectMatchingSystemPrompt } from "./JobRequirementDirectMatchingSystemPrompt";
import { JobRequirementDirectMatchResponseSchema } from "./JobRequirementDirectMatchResponseSchema";
import {
    JobRequirementDirectMatchResponse,
    JobRequirementDirectMatchResponseValidationSchema,
} from "./JobRequirementDirectMatchResponseValidationSchema";

export class JobRequirementDirectMatchingService implements IJobRequirementDirectMatchingService {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger
    ) {}

    public async assess(
        requirement: IClassifiedJobRequirement,
        profile: ICandidateProfile
    ): Promise<IJobRequirementDirectMatch> {
        this.logger.info(`[JobRequirementDirectMatchingService.assess] Assessing: ${requirement.area}`);

        const result = await this.llm.generateStructured<JobRequirementDirectMatchResponse>({
            systemPrompt: JobRequirementDirectMatchingSystemPrompt,
            input: {
                requirement,
                profile,
            },
            schemaName: "job_requirement_direct_match",
            jsonSchema: JobRequirementDirectMatchResponseSchema,
            validationSchema: JobRequirementDirectMatchResponseValidationSchema,
            temperature: 0.1,
            maxTokens: 150,
        });

        if (result.isDirectMatch && !result.evidence) {
            throw new Error(`Direct match requires evidence: ${requirement.area}`);
        }

        if (!result.isDirectMatch && result.evidence !== null) {
            throw new Error(`Non-direct match must not contain evidence: ${requirement.area}`);
        }

        return {
            requirement,
            isDirectMatch: result.isDirectMatch,
            evidence: result.evidence,
        };
    }
}
