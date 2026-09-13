export class GenerateStructuredInvalidSchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GenerateStructuredInvalidSchemaError";
    }
}
