import { InternalServerErrorException } from "@nestjs/common";
import { ILogger } from "../../Infrastructure/Logging/ILogger";

export function throwInternalError(logger: ILogger, context: string, message: string, error: unknown): never {
    const detail = error instanceof Error ? error.message : String(error);
    const description = `${message}: ${detail}`;
    logger.error(`${context} ${description}`);
    throw new InternalServerErrorException({ error: description });
}
