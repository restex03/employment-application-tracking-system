export class NotFoundError extends Error {
    constructor(message: string, property: string) {
        super(message);
        this.name = "NotFoundError";
    }
}
