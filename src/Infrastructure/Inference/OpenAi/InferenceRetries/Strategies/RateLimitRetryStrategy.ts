import { IGenerateStructuredRetryStrategy, GenerateStructuredRetryDecision } from "../IGenerateStructuredRetryStrategy";
import { getHttpStatus } from "./helpers/getHttpStatus";

export class RateLimitRetryStrategy implements IGenerateStructuredRetryStrategy {
    public readonly name = "rate-limit";

    constructor(
        private readonly maxRetries = 10,
        private readonly baseDelayMs = 500,
        private readonly maxDelayMs = 30_000
    ) {}

    public evaluate(error: unknown, context: { retryCount: number }): GenerateStructuredRetryDecision | null {
        const status = getHttpStatus(error);

        if (status !== 429) {
            return null;
        }

        if (context.retryCount >= this.maxRetries) {
            return {
                shouldRetry: false,
                delayMs: 0,
                reason: `HTTP 429 retry limit reached ` + `(${this.maxRetries} retries).`,
            };
        }

        const delayMs = Math.min(this.baseDelayMs * Math.pow(2, context.retryCount), this.maxDelayMs);

        return {
            shouldRetry: true,
            delayMs,
            reason: `HTTP 429 rate limit exceeded. ` + `Retry ${context.retryCount + 1}/${this.maxRetries}.`,
        };
    }
}
