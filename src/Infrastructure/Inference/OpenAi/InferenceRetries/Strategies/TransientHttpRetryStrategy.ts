import { IGenerateStructuredRetryStrategy, GenerateStructuredRetryDecision } from "../IGenerateStructuredRetryStrategy";
import { getHttpStatus } from "./helpers/getHttpStatus";

export class TransientHttpRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "transient-http";

    private readonly transient5xxStatuses = new Set([500, 502, 503, 504]);

    constructor(
        private readonly maxRetries = 2,
        private readonly baseDelayMs = 500
    ) {}

    public evaluate(error: unknown, context: { retryCount: number }): GenerateStructuredRetryDecision | null {
        const status = getHttpStatus(error);

        if (status === undefined || !this.transient5xxStatuses.has(status)) {
            return null;
        }

        if (context.retryCount >= this.maxRetries) {
            return {
                shouldRetry: false,
                delayMs: 0,
                reason: `Transient HTTP ${status} retry limit reached ` + `(${this.maxRetries} retries).`,
            };
        }

        return {
            shouldRetry: true,
            delayMs: this.baseDelayMs * Math.pow(2, context.retryCount),
            reason: `Transient HTTP ${status} response. ` + `Retry ${context.retryCount + 1}/${this.maxRetries}.`,
        };
    }
}
