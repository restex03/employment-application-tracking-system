// MaxTokensExceededRetryStrategy.ts

import { GenerateStructuredMaxTokensExceededError } from "../../Errors/GenerateStructuredMaxTokensExceededError";
import { IGenerateStructuredRetryStrategy, GenerateStructuredRetryDecision } from "../IGenerateStructuredRetryStrategy";

export class MaxTokensExceededRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "max-tokens-exceeded";

    public evaluate(error: unknown): GenerateStructuredRetryDecision | null {
        if (!(error instanceof GenerateStructuredMaxTokensExceededError)) {
            return null;
        }

        return {
            shouldRetry: false,
            delayMs: 0,
            reason: "Response hit maxTokens; retrying the same request unchanged would likely fail again.",
        };
    }
}
