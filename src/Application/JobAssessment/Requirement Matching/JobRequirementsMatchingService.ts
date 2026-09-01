import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementMatch } from "./IJobRequirementMatch";
import { IJobRequirementsMatchingService } from "./IJobRequirementMatchingService";
import { JobRequirementsMatchingResponseSchema } from "./JobRequirementsMatchingResponseSchema";
import { JobRequirementsMatchingResponseValidationSchema } from "./JobRequirementsMatchingResponseValidationSchema";
import { JobRequirementsMatchingSystemPrompt } from "./JobRequirementsMatchingSystemPrompt";
import { IJobRequirementMatchMapper } from "./Mappers/IJobRequirementMatchMapper";

export class JobRequirementsMatchingService implements IJobRequirementsMatchingService {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger,
        private readonly matchMapper: IJobRequirementMatchMapper
    ) {}

    public async match(
        requirements: IClassifiedJobRequirement[],
        profile: ICandidateProfile
    ): Promise<IJobRequirementMatch[]> {
        this.logger.info(`[JobRequirementsMatchingService.match] Matching ${requirements.length} requirements`);

        if (requirements.length === 0) {
            return [];
        }

        const result = await this.llm.generateStructured({
            systemPrompt: JobRequirementsMatchingSystemPrompt,
            input: {
                requirements: requirements.map((requirement, index) => ({
                    index,
                    area: requirement.area,
                    description: requirement.description,
                    category: requirement.category,
                })),
                profile,
            },

            schemaName: "job_requirements_matching",
            jsonSchema: JobRequirementsMatchingResponseSchema,
            validationSchema: JobRequirementsMatchingResponseValidationSchema,

            temperature: 0.1,
            maxTokens: 800,
        });

        const matches = this.matchMapper.map(requirements, result.matches);

        for (const match of matches) {
            this.logger.info(`\t- ${match.requirement.area}`);
            this.logger.info(`\t\t- Match: ${match.matchType}`);

            if (match.evidence) {
                this.logger.info(`\t\t- Evidence: ${match.evidence}`);
            }
        }

        this.logger.info("\n");

        return matches;
    }
}
