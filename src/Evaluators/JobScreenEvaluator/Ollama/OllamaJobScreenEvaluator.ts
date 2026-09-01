import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IJobScreenEvaluator } from "../IJobScreenEvaluator";
import { IJobScreenResult } from "../IJobScreenResult";
import { JobScreenResponseSchema } from "../JobScreenResponseSchema";
import { JobScreenResponseValidationSchema } from "../JobScreenResponseValidationSchema";
import { JobScreenSystemPrompt } from "../JobScreenSystemPrompt";

export class OllamaJobScreenEvaluator implements IJobScreenEvaluator {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger,
        private readonly model: string = "qwen3:4b-instruct-8k"
    ) {}

    public async evaluate(job: IJobPostLookup): Promise<IJobScreenResult> {
        const jobInfo = `${job.company} - ${job.requisitionId} (${job.title})`;
        this.logger.debug(`[OllamaJobScreenEvaluator.evaluate] Evaluating job: ${jobInfo}`);

        const result = await this.llm.generateStructured({
            model: this.model,
            systemPrompt: JobScreenSystemPrompt,
            input: job,

            schemaName: "job_screening",
            jsonSchema: JobScreenResponseSchema,
            validationSchema: JobScreenResponseValidationSchema,

            temperature: 0.2,
            maxTokens: 80,
        });

        return { ...result, job };
    }

    private readonly systemPrompt = JobScreenSystemPrompt;
}
