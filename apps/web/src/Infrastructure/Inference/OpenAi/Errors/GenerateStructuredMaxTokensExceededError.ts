export class GenerateStructuredMaxTokensExceededError extends Error {
    constructor(public readonly maxTokens: number) {
        super(`Model response exceeded maxTokens (${maxTokens}).`);

        this.name = "GenerateStructuredMaxTokensExceededError";
    }
}
