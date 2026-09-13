export class GenerateStructuredFinishReasonError extends Error {
    constructor(public readonly finishReason: string) {
        super(`Model generation ended with finish reason '${finishReason}'.`);

        this.name = "GenerateStructuredFinishReasonError";
    }
}
