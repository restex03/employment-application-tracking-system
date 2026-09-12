import OpenAI from "openai";
import { type ILlmInferenceProvider, StructuredInferenceRequest } from "../ILlmInferenceProvider";
import { type ILogger } from "../../Logging/ILogger";
import { type ILlmTargetOptions } from "./LlmTargetRegistry/LlmTargetRegistry";

export class OpenAiInferenceProvider implements ILlmInferenceProvider {
    private readonly client: OpenAI;

    constructor(
        private readonly logger: ILogger,
        private readonly llm: ILlmTargetOptions
    ) {
        this.client = new OpenAI({
            baseURL: this.llm.apiBaseUrl.toString(),
            apiKey: this.llm.apiKey,
        });
    }

    public async generateStructured<T>(request: StructuredInferenceRequest<T>): Promise<T> {
        const start = performance.now();
        const response = await this.client.chat.completions.create({
            model: this.llm.model,

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
            reasoning_effort: "none",
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

        // console.dir(response.choices[0], { depth: null });

        if (!content) {
            throw new Error(`[OpenAiInferenceProvider.generateStructured] Model returned no content.`);
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
            this.logger.trace(`Failed to parse JSON content: ${content}`);
            throw new Error(
                `[OpenAiInferenceProvider.generateStructured] Model returned invalid JSON: ${
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
                `[OpenAiInferenceProvider.generateStructured] Model returned invalid structured data: ${errors}`
            );
        }

        return validationResult.data;
    }
}
