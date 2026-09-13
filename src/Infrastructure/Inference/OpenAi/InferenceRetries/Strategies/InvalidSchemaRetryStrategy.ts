import { GenerateStructuredInvalidSchemaError } from "../../Errors/GenerateStructuredInvalidSchemaError";
import { IGenerateStructuredRetryStrategy, GenerateStructuredRetryDecision } from "../IGenerateStructuredRetryStrategy";

export class InvalidSchemaRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "invalid-schema";

    public evaluate(error: unknown): GenerateStructuredRetryDecision | null {
        if (!(error instanceof GenerateStructuredInvalidSchemaError)) {
            return null;
        }

        return {
            shouldRetry: false,
            delayMs: 0,
            reason: "Model completed normally but returned data that failed schema validation.",
        };
    }
}
