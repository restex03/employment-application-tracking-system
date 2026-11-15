import { describe, expect, it, vi } from "vitest";
import { JobQueuePollingManager, JobPollingStatus } from "./JobQueuePollingManager";

const isTerminalStatus = (status: JobPollingStatus): boolean => status === "COMPLETED" || status === "FAILED";

describe("JobQueuePollingManager", () => {
    it("checks status immediately when a job is added", () => {
        const getJobById = vi.fn<(jobId: string) => Promise<JobPollingStatus | null>>().mockResolvedValue("QUEUED");
        const manager = new JobQueuePollingManager({ getJobById, isTerminal: isTerminalStatus, pollIntervalMs: 1000 });

        manager.add("job-1", vi.fn());

        expect(getJobById).toHaveBeenCalledExactlyOnceWith("job-1");
    });

    it("keeps polling on the interval while the job is not terminal", async () => {
        vi.useFakeTimers();
        try {
            const getJobById = vi
                .fn<(jobId: string) => Promise<JobPollingStatus | null>>()
                .mockResolvedValue("IN_PROGRESS");
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            manager.add("job-1", vi.fn());
            await vi.advanceTimersByTimeAsync(1000);
            await vi.advanceTimersByTimeAsync(1000);

            expect(getJobById).toHaveBeenCalledTimes(3);
        } finally {
            vi.useRealTimers();
        }
    });

    it("invokes the callback once the job reaches COMPLETED and stops polling", async () => {
        vi.useFakeTimers();
        try {
            const getJobById = vi
                .fn<(jobId: string) => Promise<JobPollingStatus | null>>()
                .mockResolvedValueOnce("QUEUED")
                .mockResolvedValueOnce("IN_PROGRESS")
                .mockResolvedValueOnce("COMPLETED");
            const onSettled = vi.fn();
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            manager.add("job-1", onSettled);
            await vi.advanceTimersByTimeAsync(1000);
            await vi.advanceTimersByTimeAsync(1000);

            expect(onSettled).toHaveBeenCalledExactlyOnceWith("job-1", "COMPLETED");
            expect(manager.isPolling("job-1")).toBe(false);

            await vi.advanceTimersByTimeAsync(5000);
            expect(getJobById).toHaveBeenCalledTimes(3);
        } finally {
            vi.useRealTimers();
        }
    });

    it("invokes the callback when the job reaches FAILED", async () => {
        const getJobById = vi.fn<(jobId: string) => Promise<JobPollingStatus | null>>().mockResolvedValue("FAILED");
        const onSettled = vi.fn();
        const manager = new JobQueuePollingManager({ getJobById, isTerminal: isTerminalStatus, pollIntervalMs: 1000 });

        manager.add("job-1", onSettled);
        await Promise.resolve();
        await Promise.resolve();

        expect(onSettled).toHaveBeenCalledExactlyOnceWith("job-1", "FAILED");
    });

    it("ignores a second add() call for a job already being polled", () => {
        const getJobById = vi.fn<(jobId: string) => Promise<JobPollingStatus | null>>().mockResolvedValue("QUEUED");
        const manager = new JobQueuePollingManager({ getJobById, isTerminal: isTerminalStatus, pollIntervalMs: 1000 });

        manager.add("job-1", vi.fn());
        manager.add("job-1", vi.fn());

        expect(getJobById).toHaveBeenCalledTimes(1);
    });

    it("polls multiple jobs independently", async () => {
        vi.useFakeTimers();
        try {
            const statusByJob: Record<string, JobPollingStatus> = {
                "job-1": "IN_PROGRESS",
                "job-2": "IN_PROGRESS",
            };
            const getJobById = vi.fn(async (jobId: string) => statusByJob[jobId] ?? null);
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            const onSettled1 = vi.fn();
            const onSettled2 = vi.fn();
            manager.add("job-1", onSettled1);
            manager.add("job-2", onSettled2);

            statusByJob["job-1"] = "COMPLETED";
            await vi.advanceTimersByTimeAsync(1000);

            expect(onSettled1).toHaveBeenCalledExactlyOnceWith("job-1", "COMPLETED");
            expect(onSettled2).not.toHaveBeenCalled();
            expect(manager.isPolling("job-1")).toBe(false);
            expect(manager.isPolling("job-2")).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });

    it("stops polling a job via remove() without invoking its callback", async () => {
        vi.useFakeTimers();
        try {
            const getJobById = vi
                .fn<(jobId: string) => Promise<JobPollingStatus | null>>()
                .mockResolvedValue("IN_PROGRESS");
            const onSettled = vi.fn();
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            manager.add("job-1", onSettled);
            manager.remove("job-1");
            await vi.advanceTimersByTimeAsync(5000);

            expect(onSettled).not.toHaveBeenCalled();
            expect(getJobById).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("removeAll() stops polling every tracked job", async () => {
        vi.useFakeTimers();
        try {
            const getJobById = vi
                .fn<(jobId: string) => Promise<JobPollingStatus | null>>()
                .mockResolvedValue("IN_PROGRESS");
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            manager.add("job-1", vi.fn());
            manager.add("job-2", vi.fn());
            manager.removeAll();

            expect(manager.isPolling("job-1")).toBe(false);
            expect(manager.isPolling("job-2")).toBe(false);

            const callsBeforeAdvance = getJobById.mock.calls.length;
            await vi.advanceTimersByTimeAsync(5000);
            expect(getJobById).toHaveBeenCalledTimes(callsBeforeAdvance);
        } finally {
            vi.useRealTimers();
        }
    });

    it("keeps polling when getJobById rejects", async () => {
        vi.useFakeTimers();
        try {
            const getJobById = vi
                .fn<(jobId: string) => Promise<JobPollingStatus | null>>()
                .mockRejectedValueOnce(new Error("network error"))
                .mockResolvedValueOnce("COMPLETED");
            const onSettled = vi.fn();
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            manager.add("job-1", onSettled);
            await vi.advanceTimersByTimeAsync(1000);

            expect(onSettled).toHaveBeenCalledExactlyOnceWith("job-1", "COMPLETED");
        } finally {
            vi.useRealTimers();
        }
    });

    it("keeps polling when getJobById resolves null", async () => {
        vi.useFakeTimers();
        try {
            const getJobById = vi
                .fn<(jobId: string) => Promise<JobPollingStatus | null>>()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce("COMPLETED");
            const onSettled = vi.fn();
            const manager = new JobQueuePollingManager({
                getJobById,
                isTerminal: isTerminalStatus,
                pollIntervalMs: 1000,
            });

            manager.add("job-1", onSettled);
            await vi.advanceTimersByTimeAsync(1000);

            expect(onSettled).toHaveBeenCalledExactlyOnceWith("job-1", "COMPLETED");
        } finally {
            vi.useRealTimers();
        }
    });
});
