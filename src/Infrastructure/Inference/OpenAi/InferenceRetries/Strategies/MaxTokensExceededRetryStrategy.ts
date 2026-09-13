// MaxTokensExceededRetryStrategy.ts

import { GenerateStructuredMaxTokensExceededError } from "../../Errors/GenerateStructuredMaxTokensExceededError";
import {
    IGenerateStructuredRetryStrategy,
    GenerateStructuredRetryDecision,
    GenerateStructuredRetryContext,
} from "../IGenerateStructuredRetryStrategy";

export class MaxTokensExceededRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "max-tokens-exceeded";

    public evaluate(error: unknown, context: GenerateStructuredRetryContext): GenerateStructuredRetryDecision | null {
        if (!(error instanceof GenerateStructuredMaxTokensExceededError)) {
            return null;
        }

        if (context.retryCount >= 1) {
            return {
                shouldRetry: false,
                delayMs: 0,
                reason: "Max-token retry has already been attempted.",
            };
        }

        return {
            shouldRetry: true,
            delayMs: 0,
            reason: "Response reached the completion-token limit; " + "retrying once with a larger completion budget.",
            maxTokensOverride: Math.max(error.maxTokens * 2, 800),
        };
    }
}
