import { IGenerateStructuredRetryStrategy } from "./IGenerateStructuredRetryStrategy";
import { IGenerateStructuredRetryStrategyProvider } from "./IGenerateStructuredRetryStrategyProvider";
import { BadRequestRetryStrategy } from "./Strategies/BadRequestRetryStrategy";
import { FinishReasonErrorRetryStrategy } from "./Strategies/FinishReasonErrorRetryStrategy";
import { InvalidJsonRetryStrategy } from "./Strategies/InvalidJsonRetryStrategy";
import { InvalidSchemaRetryStrategy } from "./Strategies/InvalidSchemaRetryStrategy";
import { MaxTokensExceededRetryStrategy } from "./Strategies/MaxTokensExceededRetryStrategy";
import { RateLimitRetryStrategy } from "./Strategies/RateLimitRetryStrategy";
import { StructuredOutputFallbackRetryStrategy } from "./Strategies/StructuredOutputFallbackRetryStrategy";
import { TransientHttpRetryStrategy } from "./Strategies/TransientHttpRetryStrategy";

export class GenerateStructuredRetryStrategyProvider implements IGenerateStructuredRetryStrategyProvider {
    private readonly _strategies: readonly IGenerateStructuredRetryStrategy[];

    // Order of strategies matters; earlier strategies get evaluated first.
    constructor() {
        this._strategies = [
            new BadRequestRetryStrategy(),
            new MaxTokensExceededRetryStrategy(),
            new InvalidSchemaRetryStrategy(),
            new InvalidJsonRetryStrategy(),
            new FinishReasonErrorRetryStrategy(),
            new StructuredOutputFallbackRetryStrategy(),
            new RateLimitRetryStrategy(),
            new TransientHttpRetryStrategy(),
        ];
    }

    public get strategies(): readonly IGenerateStructuredRetryStrategy[] {
        return this._strategies;
    }
}
