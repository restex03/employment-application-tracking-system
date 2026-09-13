// TransientHttpRetryStrategy.ts

import { IGenerateStructuredRetryStrategy, GenerateStructuredRetryDecision } from "../IGenerateStructuredRetryStrategy";

function getHttpStatus(error: unknown): number | undefined {
    if (typeof error !== "object" || error === null || !("status" in error)) {
        return undefined;
    }

    const status = (error as { status?: unknown }).status;

    return typeof status === "number" ? status : undefined;
}

export class TransientHttpRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "transient-http";

    private readonly transient5xxStatuses = new Set([500, 502, 503, 504]);

    constructor(
        private readonly maxRetries = 2,
        private readonly baseDelayMs = 500
    ) {}

    public evaluate(error: unknown, context: { retryCount: number }): GenerateStructuredRetryDecision | null {
        const status = getHttpStatus(error);

        const retryable = status === 429 || (status !== undefined && this.transient5xxStatuses.has(status));

        if (!retryable) {
            return null;
        }

        return {
            shouldRetry: context.retryCount < this.maxRetries,
            delayMs: this.baseDelayMs * Math.pow(2, context.retryCount),
            reason: `Transient HTTP ${status} response.`,
        };
    }
}
