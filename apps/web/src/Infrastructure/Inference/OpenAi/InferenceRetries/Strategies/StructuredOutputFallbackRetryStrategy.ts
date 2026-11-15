import { GenerateStructuredFinishReasonError } from "../../Errors/GenerateStructuredFinishReasonError";

import {
    GenerateStructuredRetryContext,
    GenerateStructuredRetryDecision,
    IGenerateStructuredRetryStrategy,
} from "../IGenerateStructuredRetryStrategy";

export class StructuredOutputFallbackRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "structured-output-fallback";

    public evaluate(error: unknown, context: GenerateStructuredRetryContext): GenerateStructuredRetryDecision | null {
        if (!(error instanceof GenerateStructuredFinishReasonError) || error.finishReason !== "error") {
            return null;
        }

        if (context.retryCount >= 1) {
            return {
                shouldRetry: false,
                delayMs: 0,
                reason: "Structured-output fallback has already been attempted.",
            };
        }

        return {
            shouldRetry: true,
            delayMs: 0,
            reason: "JSON Schema generation failed repeatedly; " + "retrying once with JSON mode.",
            responseFormatOverride: "json_object",
        };
    }
}
