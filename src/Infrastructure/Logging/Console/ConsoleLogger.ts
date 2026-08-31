import { ILogger } from "../../../Application/Ports/Logging/ILogger";
import { LogLevel } from "../LogLevel";

export class ConsoleLogger implements ILogger {
    constructor(private readonly logLevel: LogLevel = LogLevel.Info) {}

    trace(message: string, context?: Record<string, unknown>): void {
        if (this.logLevel > LogLevel.Trace) return;
        context ? console.trace(`[TRACE] ${message}`, context) : console.trace(`[TRACE] ${message}`);
    }
    debug(message: string, context?: Record<string, unknown>): void {
        if (this.logLevel > LogLevel.Debug) return;
        context ? console.debug(`[DEBUG] ${message}`, context) : console.debug(`[DEBUG] ${message}`);
    }

    info(message: string, context?: Record<string, unknown>): void {
        if (this.logLevel > LogLevel.Info) return;
        context ? console.info(`[INFO] ${message}`, context) : console.info(`[INFO] ${message}`);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        if (this.logLevel > LogLevel.Warn) return;
        context ? console.warn(`[WARN] ${message}`, context) : console.warn(`[WARN] ${message}`);
    }

    error(message: string, context?: Record<string, unknown>): void {
        if (this.logLevel > LogLevel.Error) return;
        context ? console.error(`[ERROR] ${message}`, context) : console.error(`[ERROR] ${message}`);
    }
}
