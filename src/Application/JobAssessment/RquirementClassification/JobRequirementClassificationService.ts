import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
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
                requirements: requirements.map((requirement, index) => ({
                    index,
                    area: requirement.area,
                    description: requirement.description,
                })),
            },

            schemaName: "job_requirement_classification",
            jsonSchema: JobRequirementClassificationResponseSchema,
            validationSchema: JobRequirementClassificationResponseValidationSchema,

            temperature: 0.1,
            maxTokens: 300,
        });

        const categoryByIndex = new Map(
            result.classifications.map(classification => [classification.index, classification.category])
        );

        return requirements.map((requirement, index) => {
            const category = categoryByIndex.get(index);

            if (!category) {
                throw new Error(`Missing classification for requirement index ${index}.`);
            }

            return {
                ...requirement,
                category,
            };
        });
    }
}
