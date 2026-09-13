import { GenerateStructuredFinishReasonError } from "../../Errors/GenerateStructuredFinishReasonError";
import {
    IGenerateStructuredRetryStrategy,
    GenerateStructuredRetryContext,
    GenerateStructuredRetryDecision,
} from "../IGenerateStructuredRetryStrategy";

export class FinishReasonErrorRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "finish-reason-error";

    public evaluate(error: unknown, context: GenerateStructuredRetryContext): GenerateStructuredRetryDecision | null {
        if (!(error instanceof GenerateStructuredFinishReasonError) || error.finishReason !== "error") {
            return null;
        }

        // Let StructuredOutputFallbackRetryStrategy
        // handle the next failure.
        if (context.retryCount >= 1) {
            return null;
        }

        return {
            shouldRetry: true,
            delayMs: 250,
            reason: "Model generation ended with finish_reason=error.",
        };
    }
}
