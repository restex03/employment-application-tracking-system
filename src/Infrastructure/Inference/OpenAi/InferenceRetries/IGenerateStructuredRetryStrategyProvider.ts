import { IGenerateStructuredRetryStrategy } from "./IGenerateStructuredRetryStrategy";

export interface IGenerateStructuredRetryStrategyProvider {
    readonly strategies: readonly IGenerateStructuredRetryStrategy[];
}
