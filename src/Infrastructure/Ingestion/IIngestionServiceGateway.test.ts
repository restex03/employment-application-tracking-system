import { afterEach, describe, expect, it, vi } from "vitest";
import { ILogger } from "../Logging/ILogger";
import { IngestionServiceGateway } from "./IIngestionServiceGateway";

describe("IngestionServiceGateway", () => {
    const logger: ILogger = {
        table: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it.each([199, 300])("logs and throws for HTTP status %i", async (status) => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            status,
            statusText: "Mock status",
            text: async () => "failure details",
        }));

        const gateway = new IngestionServiceGateway("https://ingestion.example.com", logger);

        await expect(gateway.getActiveSyncTasks()).rejects.toThrow(`HTTP ${status}`);
        expect(logger.error).toHaveBeenCalledOnce();
    });

    it.each([200, 299])("accepts HTTP status %i", async (status) => {
        const tasks = [{ id: "task-1", sourceIds: [], searchText: "", status: "Queued" }];
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            status,
            statusText: "Mock status",
            text: async () => JSON.stringify(tasks),
        }));

        const gateway = new IngestionServiceGateway("https://ingestion.example.com", logger);

        await expect(gateway.getActiveSyncTasks()).resolves.toEqual(tasks);
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("logs and throws when the response body is empty", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            status: 200,
            statusText: "OK",
            text: async () => "",
        }));

        const gateway = new IngestionServiceGateway("https://ingestion.example.com", logger);

        await expect(gateway.getActiveSyncTasks()).rejects.toThrow("response body is undefined");
        expect(logger.error).toHaveBeenCalledOnce();
    });
});
