import { useCallback, useEffect, useRef, useState } from "react";
import { IJobPostSyncJob } from "../types/JobPostSyncJob";
import { JobPollingStatus, JobQueuePollingManager } from "../services/JobQueuePollingManager";

const POLL_INTERVAL_MS = 5_000;
// Single synthetic key: the manager tracks per-job-id polling, but we only care about the
// aggregate "any sync jobs active" state, so everything is polled under one key.
const SYNC_STATUS_KEY = "job-post-sync";

async function fetchActiveSyncJobs(): Promise<IJobPostSyncJob[]> {
    const response = await fetch("/api/v1/sync-jobs");
    if (!response.ok) {
        throw new Error(`Failed to fetch sync jobs: ${response.status}`);
    }
    return await response.json();
}

// Reports "COMPLETED" once no sync jobs remain active; returning null keeps the manager polling.
async function checkSyncJobsSettled(): Promise<JobPollingStatus | null> {
    const jobs = await fetchActiveSyncJobs();
    return jobs.length === 0 ? "COMPLETED" : null;
}

export interface UseSyncJobsStatusResult {
    /** True once the initial check for active sync jobs has completed. */
    initialCheckComplete: boolean;
    /** True while one or more sync jobs are queued or in progress. */
    isSyncing: boolean;
    /** Marks syncing as active and (re)starts polling, e.g. right after a new sync job was enqueued. */
    startPolling: () => void;
}

/**
 * Tracks whether any job post sync jobs are currently active by checking GET /api/v1/sync-jobs
 * on mount, then polling (via JobQueuePollingManager) until the endpoint reports no active jobs.
 */
export function useSyncJobsStatus(pollIntervalMs: number = POLL_INTERVAL_MS): UseSyncJobsStatusResult {
    const [initialCheckComplete, setInitialCheckComplete] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const managerRef = useRef<JobQueuePollingManager | null>(null);
    if (!managerRef.current) {
        managerRef.current = new JobQueuePollingManager({ checkStatus: checkSyncJobsSettled, pollIntervalMs });
    }

    const startPolling = useCallback(() => {
        setIsSyncing(true);
        managerRef.current?.add(SYNC_STATUS_KEY, () => setIsSyncing(false));
    }, []);

    useEffect(() => {
        let cancelled = false;

        const hydrate = async () => {
            try {
                const jobs = await fetchActiveSyncJobs();
                if (cancelled) {
                    return;
                }
                setInitialCheckComplete(true);
                if (jobs.length > 0) {
                    startPolling();
                }
            } catch (error) {
                console.error("Failed to check active sync jobs:", error);
                if (!cancelled) {
                    setInitialCheckComplete(true);
                }
            }
        };

        void hydrate();

        return () => {
            cancelled = true;
            managerRef.current?.removeAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; startPolling is stable in practice
    }, []);

    return { initialCheckComplete, isSyncing, startPolling };
}
