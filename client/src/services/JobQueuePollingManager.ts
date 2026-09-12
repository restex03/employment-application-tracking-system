export type JobPollingStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type JobPollingSettledCallback<TJob> = (jobId: string, job: TJob) => void;

/** Opaque timer handle, avoiding the conflicting DOM (number) vs Node (Timeout) setInterval return types. */
export type PollingTimerHandle = unknown;

export interface JobQueuePollingManagerOptions<TJob> {
    /** Fetches the current job by id. Return null if it could not be determined (polling continues). */
    getJobById: (jobId: string) => Promise<TJob | null>;
    /** Determines whether a job has reached a terminal state, at which point polling stops. */
    isTerminal: (job: TJob) => boolean;
    pollIntervalMs?: number;
    setIntervalFn?: (handler: () => void, timeoutMs: number) => PollingTimerHandle;
    clearIntervalFn?: (handle: PollingTimerHandle) => void;
}

const DEFAULT_POLL_INTERVAL_MS = 10_000;

/**
 * Polls a set of jobs by id until each reaches a terminal state (as determined by the
 * `isTerminal` callback), then invokes the callback registered for that job exactly once.
 * Has no React or app dependencies so it can be unit tested in isolation.
 */
export class JobQueuePollingManager<TJob> {
    private readonly getJobById: (jobId: string) => Promise<TJob | null>;
    private readonly isTerminal: (job: TJob) => boolean;
    private readonly pollIntervalMs: number;
    private readonly setIntervalFn: (handler: () => void, timeoutMs: number) => PollingTimerHandle;
    private readonly clearIntervalFn: (handle: PollingTimerHandle) => void;
    private readonly timers = new Map<string, PollingTimerHandle>();

    constructor(options: JobQueuePollingManagerOptions<TJob>) {
        this.getJobById = options.getJobById;
        this.isTerminal = options.isTerminal;
        this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
        // Wrapped (not passed directly) so the global timer functions aren't invoked with the wrong `this`.
        this.setIntervalFn = options.setIntervalFn ?? ((handler, timeout) => setInterval(handler, timeout));
        this.clearIntervalFn =
            options.clearIntervalFn ?? (id => clearInterval(id as Parameters<typeof clearInterval>[0]));
    }

    /**
     * Starts polling the given job. Ignored if the job is already being polled.
     * Checks immediately, then on the configured interval, until a terminal state is reached.
     */
    public add(jobId: string, onSettled: JobPollingSettledCallback<TJob>): void {
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

    /** Number of jobs currently being polled. */
    public get size(): number {
        return this.timers.size;
    }

    private async poll(jobId: string, onSettled: JobPollingSettledCallback<TJob>): Promise<void> {
        // The job may have been removed while this check was in flight.
        if (!this.timers.has(jobId)) {
            return;
        }

        let job: TJob | null;
        try {
            job = await this.getJobById(jobId);
        } catch {
            return;
        }

        // Re-check after the async status fetch in case it was removed mid-flight.
        if (job !== null && this.isTerminal(job) && this.timers.has(jobId)) {
            this.remove(jobId);
            onSettled(jobId, job);
        }
    }
}
