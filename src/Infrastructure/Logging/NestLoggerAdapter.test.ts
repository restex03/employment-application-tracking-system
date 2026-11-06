import { Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogLevel } from "./LogLevel";
import { NestLoggerAdapter } from "./NestLoggerAdapter";

describe("NestLoggerAdapter", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("maps ILogger methods to the corresponding Nest logger methods", () => {
        const verbose = vi.spyOn(Logger.prototype, "verbose").mockImplementation(() => {});
        const debug = vi.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
        const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
        const error = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});
        const logger = new NestLoggerAdapter(LogLevel.Trace);
        const context = { requestId: "request-1" };

        logger.trace("trace", context);
        logger.debug("debug", context);
        logger.info("info", context);
        logger.warn("warn", context);
        logger.error("error", context);

        expect(verbose).toHaveBeenCalledWith("trace", context);
        expect(debug).toHaveBeenCalledWith("debug", context);
        expect(log).toHaveBeenCalledWith("info", context);
        expect(warn).toHaveBeenCalledWith("warn", context);
        expect(error).toHaveBeenCalledWith("error", context);
    });

    it("preserves the configured log-level threshold", () => {
        const verbose = vi.spyOn(Logger.prototype, "verbose").mockImplementation(() => {});
        const debug = vi.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
        const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
        const logger = new NestLoggerAdapter(LogLevel.Warn);

        logger.trace("trace");
        logger.debug("debug");
        logger.info("info");
        logger.warn("warn");

        expect(verbose).not.toHaveBeenCalled();
        expect(debug).not.toHaveBeenCalled();
        expect(log).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith("warn");
    });
});
