import { GenerateStructuredRetryDecision, IGenerateStructuredRetryStrategy } from "../IGenerateStructuredRetryStrategy";

function getHttpStatus(error: unknown): number | undefined {
    if (typeof error !== "object" || error === null || !("status" in error)) {
        return undefined;
    }

    const status = (error as { status?: unknown }).status;

    return typeof status === "number" ? status : undefined;
}

export class BadRequestRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "bad-request";

    public evaluate(error: unknown): GenerateStructuredRetryDecision | null {
        if (getHttpStatus(error) !== 400) {
            return null;
        }

        return {
            shouldRetry: false,
            delayMs: 0,
            reason: "HTTP 400 indicates an invalid request; retrying it unchanged will not help.",
        };
    }
}
