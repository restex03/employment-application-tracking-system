export type JobPollingStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type JobPollingSettledCallback = (jobId: string, status: JobPollingStatus) => void;

/** Opaque timer handle, avoiding the conflicting DOM (number) vs Node (Timeout) setInterval return types. */
export type PollingTimerHandle = unknown;

export interface JobQueuePollingManagerOptions {
    /** Fetches the current status of a job. Return null if the status could not be determined (polling continues). */
    checkStatus: (jobId: string) => Promise<JobPollingStatus | null>;
    pollIntervalMs?: number;
    setIntervalFn?: (handler: () => void, timeoutMs: number) => PollingTimerHandle;
    clearIntervalFn?: (handle: PollingTimerHandle) => void;
}

const DEFAULT_POLL_INTERVAL_MS = 10_000;
const TERMINAL_STATUSES: ReadonlySet<JobPollingStatus> = new Set(["COMPLETED", "FAILED"]);

/**
 * Polls a set of jobs by id until each reaches a terminal status (COMPLETED or FAILED),
 * then invokes the callback registered for that job exactly once. Has no React or app
 * dependencies so it can be unit tested in isolation.
 */
export class JobQueuePollingManager {
    private readonly checkStatus: (jobId: string) => Promise<JobPollingStatus | null>;
    private readonly pollIntervalMs: number;
    private readonly setIntervalFn: (handler: () => void, timeoutMs: number) => PollingTimerHandle;
    private readonly clearIntervalFn: (handle: PollingTimerHandle) => void;
    private readonly timers = new Map<string, PollingTimerHandle>();

    constructor(options: JobQueuePollingManagerOptions) {
        this.checkStatus = options.checkStatus;
        this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
        // Wrapped (not passed directly) so the global timer functions aren't invoked with the wrong `this`.
        this.setIntervalFn = options.setIntervalFn ?? ((handler, timeout) => setInterval(handler, timeout));
        this.clearIntervalFn =
            options.clearIntervalFn ?? (id => clearInterval(id as Parameters<typeof clearInterval>[0]));
    }

    /**
     * Starts polling the given job. Ignored if the job is already being polled.
     * Checks immediately, then on the configured interval, until a terminal status is reached.
     */
    public add(jobId: string, onSettled: JobPollingSettledCallback): void {
        if (this.timers.has(jobId)) {
            return;
        }

        const timer = this.setIntervalFn(() => {
            void this.poll(jobId, onSettled);
        }, this.pollIntervalMs);
        this.timers.set(jobId, timer);

        void this.poll(jobId, onSettled);
    }

    /** Stops polling the given job without invoking its callback. */
    public remove(jobId: string): void {
        const timer = this.timers.get(jobId);
        if (timer !== undefined) {
            this.clearIntervalFn(timer);
            this.timers.delete(jobId);
        }
    }

    /** Stops polling all jobs without invoking any callbacks. */
    public removeAll(): void {
        for (const jobId of this.timers.keys()) {
            this.remove(jobId);
        }
    }

    public isPolling(jobId: string): boolean {
        return this.timers.has(jobId);
    }

    private async poll(jobId: string, onSettled: JobPollingSettledCallback): Promise<void> {
        // The job may have been removed while this check was in flight.
        if (!this.timers.has(jobId)) {
            return;
        }

        let status: JobPollingStatus | null;
        try {
            status = await this.checkStatus(jobId);
        } catch {
            return;
        }

        // Re-check after the async status fetch in case it was removed mid-flight.
        if (status !== null && TERMINAL_STATUSES.has(status) && this.timers.has(jobId)) {
            this.remove(jobId);
            onSettled(jobId, status);
        }
    }
}
