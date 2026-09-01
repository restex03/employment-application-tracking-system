import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirementsResult";
import { IClassifiedJobRequirement } from "./IClassifiedJobRequirement";
import { IJobRequirementClassificationService } from "./IJobRequirementClassificationService";
import { JobRequirementClassificationResponseSchema } from "./JobRequirementClassificationResponseSchema";
import { JobRequirementClassificationResponseValidationSchema } from "./JobRequirementClassificationResponseValidationSchema";
import { JobRequirementClassificationSystemPrompt } from "./JobRequirementClassificationSystemPrompt";

export class JobRequirementClassificationService implements IJobRequirementClassificationService {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger
    ) {}

    public async classify(requirements: IJobRequirement[]): Promise<IClassifiedJobRequirement[]> {
        this.logger.info(
            `[JobRequirementClassificationService.classify] Classifying ${requirements.length} requirements`
        );

        if (requirements.length === 0) {
            return [];
        }

        const result = await this.llm.generateStructured({
            systemPrompt: JobRequirementClassificationSystemPrompt,
            input: {
                requirements,
            },

            schemaName: "job_requirement_classification",
            jsonSchema: JobRequirementClassificationResponseSchema,
            validationSchema: JobRequirementClassificationResponseValidationSchema,

            temperature: 0.1,
            maxTokens: 800,
        });

        for (const requirement of result.requirements) {
            this.logger.info(`\t- ${requirement.area}`);
            this.logger.info(`\t\t- Category: ${requirement.category}`);
        }

        this.logger.info("\n");

        return result.requirements;
    }
}
