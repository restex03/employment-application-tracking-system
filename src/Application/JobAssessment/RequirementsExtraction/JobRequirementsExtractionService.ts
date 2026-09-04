import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobRequirementsExtractionService } from "./IJobRequirementsExtractionService";
import { IJobRequirement } from "./IJobRequirement";
import { JobRequirementsExtractorSystemPrompt } from "./JobRequirementsExtractorSystemPrompt";
import { JobRequirementsResponseSchema } from "./JobRequirementsResponseSchema";
import { JobRequirementsResponseValidationSchema } from "./JobRequirementsResponseValidationSchema";

export class JobRequirementsExtractionService implements IJobRequirementsExtractionService {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger
    ) {}

    public async extract(job: IJobPostDetail): Promise<IJobRequirement[]> {
        const jobInfo = `${job.requisitionId} (${job.title})`;

        this.logger.info(`[JobRequirementsExtractionService.extract] Extracting job requirements`);

        const result = await this.llm.generateStructured({
            systemPrompt: JobRequirementsExtractorSystemPrompt,
            input: job,

            schemaName: "job_requirements",
            jsonSchema: JobRequirementsResponseSchema,
            validationSchema: JobRequirementsResponseValidationSchema,

            temperature: 0.1,
            maxTokens: 800,
        });

        this.logger.info(jobInfo);
        this.logger.info(`\t- Requirements: ${result.requirements.length}`);

        for (const requirement of result.requirements) {
            this.logger.info(`\t\t- ${requirement.area}`);
            this.logger.info(`\t\t\t- Description: ${requirement.description}`);
        }

        this.logger.info("\n");

        return result.requirements;
    }
}
