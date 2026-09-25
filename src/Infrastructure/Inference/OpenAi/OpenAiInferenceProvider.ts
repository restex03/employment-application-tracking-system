import OpenAI from "openai";

import { type ILlmInferenceProvider, StructuredInferenceRequest } from "../ILlmInferenceProvider";

import { type ILogger } from "../../Logging/ILogger";

import { type ILlmTargetOptions } from "./LlmTargetRegistry/LlmTargetRegistry";

import { GenerateStructuredFinishReasonError } from "./Errors/GenerateStructuredFinishReasonError";
import { GenerateStructuredInvalidJsonError } from "./Errors/GenerateStructuredInvalidJsonError";
import { GenerateStructuredInvalidSchemaError } from "./Errors/GenerateStructuredInvalidSchemaError";
import { GenerateStructuredMaxTokensExceededError } from "./Errors/GenerateStructuredMaxTokensExceededError";

import { IGenerateStructuredRetryStrategyProvider } from "./InferenceRetries/IGenerateStructuredRetryStrategyProvider";

import { StructuredResponseFormat } from "./InferenceRetries/IGenerateStructuredRetryStrategy";

interface GenerateStructuredAttemptOptions {
    responseFormat: StructuredResponseFormat;
    maxTokens: number;
}

export class OpenAiInferenceProvider implements ILlmInferenceProvider {
    private readonly client: OpenAI;

    constructor(
        private readonly logger: ILogger,
        private readonly llm: ILlmTargetOptions,
        private readonly retryStrategyProvider: IGenerateStructuredRetryStrategyProvider
    ) {
        this.client = new OpenAI({
            baseURL: this.llm.apiBaseUrl.toString(),
            apiKey: this.llm.apiKey,

            // Retry behavior is owned by our retry strategies.
            maxRetries: 0,
        });
    }

    public async generateStructured<T>(request: StructuredInferenceRequest<T>): Promise<T> {
        const retryCounts = new Map<string, number>();

        const attemptOptions: GenerateStructuredAttemptOptions = {
            responseFormat: "json_schema",
            maxTokens: request.maxTokens ?? 0,
        };

        while (true) {
            try {
                return await this.generateStructuredOnce(request, attemptOptions);
            } catch (error) {
                const shouldRetry = await this.tryRetry(error, retryCounts, attemptOptions);

                if (!shouldRetry) {
                    throw error;
                }
            }
        }
    }

    private async generateStructuredOnce<T>(
        request: StructuredInferenceRequest<T>,
        attemptOptions: GenerateStructuredAttemptOptions
    ): Promise<T> {
        const start = performance.now();

        const responseFormat =
            attemptOptions.responseFormat === "json_object"
                ? {
                      type: "json_object" as const,
                  }
                : {
                      type: "json_schema" as const,
                      json_schema: {
                          name: request.schemaName,
                          strict: true,
                          schema: request.jsonSchema,
                      },
                  };

        this.logger.debug(
            `[OpenAiInferenceProvider.generateStructured] ` + `Response format: ${attemptOptions.responseFormat}`
        );

        const response = await this.client.chat.completions.create({
            model: this.llm.model,

            temperature: request.temperature,

            max_tokens: attemptOptions.maxTokens,

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

            ...(this.llm.reasoningEffort !== undefined && {
                reasoning_effort: this.llm.reasoningEffort,
            }),

            response_format: responseFormat,
        });

        const elapsed = performance.now() - start;

        const choice = response.choices[0];

        if (!choice) {
            throw new Error(`[OpenAiInferenceProvider.generateStructured] ` + `Model returned no choices.`);
        }

        /*
         * OpenAI-compatible providers may return finish reasons
         * that are not represented by the OpenAI SDK's literal union.
         */
        const finishReason: string = choice.finish_reason;

        const content = choice.message?.content;

        this.logger.debug("********************************************************");
        this.logger.debug("*************** Model Response Analysis ****************");
        this.logger.debug("********************************************************");
        this.logger.debug(`\tModel: ${this.llm.model}`);
        this.logger.debug(`\tResponse format: ${attemptOptions.responseFormat}`);
        this.logger.debug(`\tEvaluation time (s): ${(elapsed / 1000).toFixed(1)}`);
        this.logger.debug(`\tPrompt tokens: ${response.usage?.prompt_tokens}`);
        this.logger.debug(`\tCompletion tokens: ${response.usage?.completion_tokens}`);
        this.logger.debug(`\tCompletion chars: ${content?.length ?? 0}`);
        this.logger.debug(`\tFinish reason: ${finishReason}`);
        this.logger.debug("********************************************************");

        if (finishReason === "length") {
            this.logger.trace(
                `[OpenAiInferenceProvider.generateStructured] ` + `Truncated content: ${content ?? "<null>"}`
            );

            throw new GenerateStructuredMaxTokensExceededError(attemptOptions.maxTokens);
        }

        if (finishReason !== "stop") {
            this.logger.trace(
                `[OpenAiInferenceProvider.generateStructured] ` +
                    `Non-stop completion choice: ${JSON.stringify(choice)}`
            );

            throw new GenerateStructuredFinishReasonError(finishReason);
        }

        if (!content) {
            throw new Error(`[OpenAiInferenceProvider.generateStructured] ` + `Model returned no content.`);
        }

        let json: unknown;

        try {
            console.log(content);
            json = JSON.parse(content);
        } catch (error) {
            this.logger.trace(`Failed to parse JSON content: ${content}`);

            throw new GenerateStructuredInvalidJsonError(
                `[OpenAiInferenceProvider.generateStructured] ` +
                    `Model returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`
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

            throw new GenerateStructuredInvalidSchemaError(
                `[OpenAiInferenceProvider.generateStructured] ` + `Model returned invalid structured data: ${errors}`
            );
        }

        return validationResult.data;
    }

    private async tryRetry(
        error: unknown,
        retryCounts: Map<string, number>,
        attemptOptions: GenerateStructuredAttemptOptions
    ): Promise<boolean> {
        for (const strategy of this.retryStrategyProvider.strategies) {
            const retryCount = retryCounts.get(strategy.name) ?? 0;

            const decision = strategy.evaluate(error, {
                retryCount,
            });

            if (!decision) {
                continue;
            }

            if (!decision.shouldRetry) {
                this.logger.debug(
                    `[OpenAiInferenceProvider.generateStructured] ` +
                        `Not retrying (${strategy.name}): ` +
                        decision.reason
                );

                return false;
            }

            retryCounts.set(strategy.name, retryCount + 1);

            if (decision.responseFormatOverride) {
                attemptOptions.responseFormat = decision.responseFormatOverride;

                this.logger.debug(
                    `[OpenAiInferenceProvider.generateStructured] ` +
                        `Overriding response format to ` +
                        `${decision.responseFormatOverride}`
                );
            }

            if (decision.maxTokensOverride) {
                this.logger.debug(
                    `[OpenAiInferenceProvider.generateStructured] ` +
                        `Overriding max tokens to ` +
                        `${decision.maxTokensOverride}`
                );

                attemptOptions.maxTokens = decision.maxTokensOverride;
            }

            this.logger.debug(
                `[OpenAiInferenceProvider.generateStructured] ` +
                    `Retrying (${strategy.name}) in ` +
                    `${decision.delayMs}ms. ` +
                    decision.reason
            );

            if (decision.delayMs > 0) {
                await this.delay(decision.delayMs);
            }

            return true;
        }

        return false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
