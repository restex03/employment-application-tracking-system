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
        const start = performance.now();
        const response = await this.llm.client.chat.completions.create({
            model: this.model,

            temperature: 0.2,

            max_tokens: 80,

            messages: [
                {
                    role: "system",
                    content: this.systemPrompt,
                },
                {
                    role: "user",
                    content: JSON.stringify(job),
                },
            ],

            response_format: {
                type: "json_schema",

                json_schema: {
                    name: "job_screening",
                    strict: true,
                    schema: JobScreenResponseSchema,
                },
            },
        });

        const elapsed = performance.now() - start;
        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error(`[OllamaJobScreenEvaluator.evaluate] Model returned no content for ${jobInfo}.`);
        }

        this.logger.debug("********************************************************");
        this.logger.debug("*************** Model Response Analysis ****************");
        this.logger.debug("********************************************************");
        this.logger.debug(`\tEvaluation time (s): ${(elapsed / 1000).toFixed(1)}`);
        this.logger.debug(`\tPrompt tokens: ${response.usage?.prompt_tokens}`);
        this.logger.debug(`\tCompletion tokens: ${response.usage?.completion_tokens}`);
        this.logger.debug(`\tCompletion chars: ${content!.length}`);
        this.logger.debug(`\tFinish reason: ${response.choices[0]?.finish_reason}`);
        this.logger.debug("********************************************************");

        let json: unknown;

        try {
            json = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `[OllamaJobScreenEvaluator.evaluate] Model returned invalid JSON for ${jobInfo}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const validationResult = JobScreenResponseValidationSchema.safeParse(json);

        if (!validationResult.success) {
            this.logger.debug(
                `[OllamaJobScreenEvaluator.evaluate] Model returned invalid JSON for ${jobInfo}: ${JSON.stringify(json, null, 2)}`
            );
            const errors = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

                    return `${path}: ${issue.message}`;
                })
                .join("; ");

            throw new Error(
                `[OllamaJobScreenEvaluator.evaluate] Model returned invalid screening data for ${jobInfo}: ${errors}`
            );
        }

        return { ...validationResult.data, job };
    }

    private readonly systemPrompt = JobScreenSystemPrompt;
}
