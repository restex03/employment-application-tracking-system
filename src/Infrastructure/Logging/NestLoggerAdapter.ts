import { Logger } from "@nestjs/common";
import { ILogger } from "./ILogger";
import { LogLevel } from "./LogLevel";

export class NestLoggerAdapter implements ILogger {
    private readonly logger = new Logger("Application");

    constructor(private readonly logLevel: LogLevel = LogLevel.Info) {}

    trace(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Trace) {
            this.logger.verbose(message, ...args);
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Debug) {
            this.logger.debug(message, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Info) {
            this.logger.log(message, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Warn) {
            this.logger.warn(message, ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Error) {
            this.logger.error(message, ...args);
        }
    }
}
