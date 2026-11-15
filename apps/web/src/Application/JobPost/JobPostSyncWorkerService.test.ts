import { describe, expect, it, vi } from "vitest";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostService } from "./IJobPostService";
import { JobPostSyncWorkerService } from "./JobPostSyncWorkerService";

describe("JobPostSyncWorkerService", () => {
    it("syncs from the latest imported date and upserts gateway results", async () => {
        const latestJob = { importedDate: new Date("2026-10-30T00:00:00Z") } as IJobPost;
        const jobPostService = createService();
        const jobPostRepository = createRepository(latestJob);
        const logger = createLogger();
        const worker = new JobPostSyncWorkerService(jobPostService, jobPostRepository, logger);

        const workerTask = worker.start({ freqMs: 60 * 60 * 1000 });
        await vi.waitFor(() => {
            expect(jobPostService.importJobPosts).toHaveBeenCalledWith("2026-10-30T00:00:00.000Z");
        });
        worker.stop();
        await workerTask;

        expect(jobPostRepository.getLatestJob).toHaveBeenCalledOnce();
    });

    it("starts from the Unix epoch when the local repository is empty", async () => {
        const jobPostService = createService();
        const jobPostRepository = createRepository(undefined);
        const worker = new JobPostSyncWorkerService(jobPostService, jobPostRepository, createLogger());

        const workerTask = worker.start({ freqMs: 60 * 60 * 1000 });
        await vi.waitFor(() => {
            expect(jobPostService.importJobPosts).toHaveBeenCalledWith("1970-01-01T00:00:00.000Z");
        });
        expect(jobPostRepository.getLatestJob).toHaveBeenCalledOnce();
        worker.stop();
        await workerTask;
    });

    it("continues syncing after the configured interval and stops promptly", async () => {
        const jobPostService = createService();
        const worker = new JobPostSyncWorkerService(jobPostService, createRepository(undefined), createLogger());

        const workerTask = worker.start({ freqMs: 30 });
        await vi.waitFor(() =>
            expect(vi.mocked(jobPostService.importJobPosts).mock.calls.length).toBeGreaterThanOrEqual(2)
        );
        worker.stop();
        await workerTask;
    });
});

function createService(): IJobPostService {
    return {
        getById: vi.fn(),
        importJobPosts: vi.fn().mockResolvedValue(undefined),
        list: vi.fn(),
    };
}

function createRepository(latestJob: IJobPost | undefined): IJobPostRepository {
    return {
        getById: vi.fn(),
        getLatestJob: vi.fn().mockResolvedValue(latestJob),
        list: vi.fn(),
        upsert: vi.fn(),
        upsertMany: vi.fn(),
    };
}

function createLogger(): ILogger {
    return {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
}
