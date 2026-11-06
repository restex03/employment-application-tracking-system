import { Logger } from "@nestjs/common";
import { ILogger } from "./ILogger";
import { LogLevel } from "./LogLevel";

const logLevels = [LogLevel.Verbose, LogLevel.Debug, LogLevel.Log, LogLevel.Warn, LogLevel.Error, LogLevel.Fatal];

export class NestLoggerAdapter implements ILogger {
    private readonly logger = new Logger("Application");

    constructor(private readonly logLevel: LogLevel = LogLevel.Log) {}

    trace(message: string, ...args: unknown[]): void {
        if (this.isEnabled(LogLevel.Verbose)) {
            this.logger.verbose(message, ...args);
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.isEnabled(LogLevel.Debug)) {
            this.logger.debug(message, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.isEnabled(LogLevel.Log)) {
            this.logger.log(message, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.isEnabled(LogLevel.Warn)) {
            this.logger.warn(message, ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.isEnabled(LogLevel.Error)) {
            this.logger.error(message, ...args);
        }
    }

    private isEnabled(level: LogLevel): boolean {
        return logLevels.indexOf(level) >= logLevels.indexOf(this.logLevel);
    }
}
