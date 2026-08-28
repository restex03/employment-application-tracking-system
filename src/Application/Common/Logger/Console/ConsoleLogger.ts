import { ILogger } from "../ILogger";

export class ConsoleLogger implements ILogger {
    debug(message: string, context?: Record<string, unknown>): void {
        context ? console.debug(`[DEBUG] ${message}`, context) : console.debug(`[DEBUG] ${message}`);
    }

    info(message: string, context?: Record<string, unknown>): void {
        context ? console.info(`[INFO] ${message}`, context) : console.info(`[INFO] ${message}`);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        context ? console.warn(`[WARN] ${message}`, context) : console.warn(`[WARN] ${message}`);
    }

    error(message: string, context?: Record<string, unknown>): void {
        context ? console.error(`[ERROR] ${message}`, context) : console.error(`[ERROR] ${message}`);
    }
}
