import { GenerateStructuredInvalidJsonError } from "../../Errors/GenerateStructuredInvalidJsonError";
import { IGenerateStructuredRetryStrategy, GenerateStructuredRetryDecision } from "../IGenerateStructuredRetryStrategy";

export class InvalidJsonRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "invalid-json";

    public evaluate(error: unknown): GenerateStructuredRetryDecision | null {
        if (!(error instanceof GenerateStructuredInvalidJsonError)) {
            return null;
        }

        return {
            shouldRetry: false,
            delayMs: 0,
            reason: "Model completed normally but returned invalid JSON.",
        };
    }
}
