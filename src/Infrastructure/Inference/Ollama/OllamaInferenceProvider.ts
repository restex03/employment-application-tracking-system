import OpenAI from "openai";
import { ILlmInferenceProvider, StructuredInferenceRequest } from "../ILlmInferenceProvider";
import { ILogger } from "../../Logging/ILogger";

export class OllamaInferenceProvider implements ILlmInferenceProvider {
    private readonly client: OpenAI;

    constructor(
        private readonly logger: ILogger,
        private readonly model: string = "qwen3:4b-instruct-8k"
    ) {
        this.client = new OpenAI({
            // TODO: Move to .env
            baseURL: "http://localhost:11434/v1",
            apiKey: "ollama",
        });
    }

    public async generateStructured<T>(request: StructuredInferenceRequest<T>): Promise<T> {
        const start = performance.now();
        const response = await this.client.chat.completions.create({
            model: this.model,

            temperature: request.temperature,

            max_tokens: request.maxTokens,

            messages: [
                {
                    role: "system",
                    content: request.systemPrompt,
                },
                {
                    role: "user",
                    content: typeof request.input === "string" ? request.input : JSON.stringify(request.input),
                },
            ],

            response_format: {
                type: "json_schema",
                json_schema: {
                    name: request.schemaName,
                    strict: true,
                    schema: request.jsonSchema,
                },
            },
        });

        const elapsed = performance.now() - start;
        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error(`[OllamaInferenceProvider.generateStructured] Model returned no content.`);
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
                `[OllamaInferenceProvider.generateStructured] Model returned invalid JSON: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const validationResult = request.validationSchema.safeParse(json);

        if (!validationResult.success) {
            const errors = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

                    return `${path}: ${issue.message}`;
                })
                .join("; ");

            throw new Error(
                `[OllamaInferenceProvider.generateStructured] Model returned invalid structured data: ${errors}`
            );
        }

        return validationResult.data;
    }
}
