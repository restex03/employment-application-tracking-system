export class GenerateStructuredInvalidJsonError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GenerateStructuredInvalidJsonError";
    }
}
