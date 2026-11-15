export interface GenerateStructuredRetryContext {
    /**
     * Number of retries already performed by this strategy.
     * 0 means this is the first failure handled by the strategy.
     */
    retryCount: number;
}

export type StructuredResponseFormat = "json_schema" | "json_object";

export interface GenerateStructuredRetryDecision {
    shouldRetry: boolean;
    delayMs: number;
    reason: string;

    responseFormatOverride?: StructuredResponseFormat;
    maxTokensOverride?: number;
}
export interface IGenerateStructuredRetryStrategy {
    readonly name: string;

    evaluate(error: unknown, context: GenerateStructuredRetryContext): GenerateStructuredRetryDecision | null;
}
