import { IJobSearchResult } from "../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { ILogger } from "../../Application/Common/Logger/ILogger";
import { OpenAiConnection } from "../../ModelConnections/Ollama/OllamaClientConnection";
import { IJobScreener } from "./IJobScreener";
import { IJobScreeningResult } from "./IJobScreeningResult";
import { JobScreeningResponseSchema } from "./JobScreeningResponseSchema";
import { JobScreeningResponseValidationSchema } from "./JobScreeningResponseValidationSchema";
import { JobScreenerSystemPrompt } from "./JobScreenerSystemPrompt";

export class JobScreener implements IJobScreener {
    constructor(
        private readonly openAi: OpenAiConnection,
        private readonly logger: ILogger,
        // private readonly model: string = "openai/gpt-oss-120b",
        private readonly model: string = "qwen3:4b-instruct-8k"
        // private readonly model: string = "qwen3:8b",
    ) {}

    public async screen(jobs: IJobSearchResult[]): Promise<IJobScreeningResult[]> {
        const results: IJobScreeningResult[] = [];

        for (const job of jobs) {
            const result = await this.screenJob(job);

            results.push(result);
        }

        return results;
    }

    private async screenJob(job: IJobSearchResult): Promise<IJobScreeningResult> {
        const start = performance.now();

        const response = await this.openAi.client.chat.completions.create({
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
                    schema: JobScreeningResponseSchema,
                },
            },
        });

        const elapsed = performance.now() - start;

        this.logger.debug(`${job.company} - ${job.title}: screened in ` + `${(elapsed / 1000).toFixed(2)}s`);

        this.logger.debug(
            `Prompt tokens: ${response.usage?.prompt_tokens}, ` +
                `Completion tokens: ${response.usage?.completion_tokens}`
        );

        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error(`Job screener returned no content for ${job.id}.`);
        }

        let json: unknown;

        try {
            json = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `Job screener returned invalid JSON for ${job.id}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const validationResult = JobScreeningResponseValidationSchema.safeParse(json);

        if (!validationResult.success) {
            this.logger.error(`Job screener returned JSON for ${job.id}: ${JSON.stringify(json)}`);
            const errors = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

                    return `${path}: ${issue.message}`;
                })
                .join("; ");

            throw new Error(`Job screener returned invalid result for ` + `${job.id}: ${errors}`);
        }

        return { ...validationResult.data, job };
    }

    private readonly systemPrompt = JobScreenerSystemPrompt;
}
