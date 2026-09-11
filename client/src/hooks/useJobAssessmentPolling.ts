import { useState, useEffect, useCallback, useRef } from "react";
import { JobQueueStatus } from "../types/JobAssessmentJob";

export interface ToastMessage {
    id: string;
    type: "success" | "error" | "info";
    message: string;
}

interface TrackedJob {
    jobId: string;
    status: JobQueueStatus | null;
}

interface UseJobAssessmentPollingOptions {
    candidateProfileId: string;
    pollIntervalMs?: number;
}

interface UseJobAssessmentPollingResult {
    getStatus: (jobPostId: string) => JobQueueStatus | null;
    enqueue: (jobPostId: string) => Promise<void>;
    enqueueMany: (jobPostIds: string[]) => Promise<void>;
    toasts: ToastMessage[];
    dismissToast: (id: string) => void;
}

const POLL_INTERVAL_MS = 10_000;
const IN_FLIGHT_STATUSES: Array<JobQueueStatus | null> = [null, "QUEUED", "IN_PROGRESS"];

export function useJobAssessmentPolling({
    candidateProfileId,
    pollIntervalMs = POLL_INTERVAL_MS,
}: UseJobAssessmentPollingOptions): UseJobAssessmentPollingResult {
    const [trackedJobs, setTrackedJobs] = useState<Record<string, TrackedJob>>({});
    const trackedJobsRef = useRef<Record<string, TrackedJob>>({});
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        trackedJobsRef.current = trackedJobs;
    }, [trackedJobs]);

    const addToast = useCallback((type: ToastMessage["type"], message: string) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const pollJob = useCallback(
        async (jobPostId: string, jobId: string) => {
            try {
                const response = await fetch(`/api/v1/assessment-jobs/${jobId}`);
                if (!response.ok) {
                    return;
                }
                const data = await response.json();
                const status = data.status as JobQueueStatus;

                // Ignore stale responses if a newer job was enqueued for this job post in the meantime.
                setTrackedJobs(prev => {
                    const existing = prev[jobPostId];
                    if (!existing || existing.jobId !== jobId) {
                        return prev;
                    }
                    return { ...prev, [jobPostId]: { ...existing, status } };
                });

                if (status === "COMPLETED") {
                    addToast("success", "Job assessment completed successfully.");
                } else if (status === "FAILED") {
                    addToast("error", "Job assessment failed.");
                }
            } catch {
                // network errors are transient; keep polling
            }
        },
        [addToast]
    );

    const pollAllInFlight = useCallback(() => {
        const inFlightEntries = Object.entries(trackedJobsRef.current).filter(([, job]) =>
            IN_FLIGHT_STATUSES.includes(job.status)
        );

        if (inFlightEntries.length === 0) {
            stopPolling();
            return;
        }

        for (const [jobPostId, job] of inFlightEntries) {
            pollJob(jobPostId, job.jobId);
        }
    }, [pollJob, stopPolling]);

    const ensurePolling = useCallback(() => {
        if (!pollRef.current) {
            pollRef.current = setInterval(pollAllInFlight, pollIntervalMs);
        }
    }, [pollAllInFlight, pollIntervalMs]);

    const enqueue = useCallback(
        async (jobPostId: string) => {
            try {
                const response = await fetch(`/api/v1/job-posts/${jobPostId}/assessments/${candidateProfileId}`, {
                    method: "POST",
                });

                if (!response.ok && response.status !== 202) {
                    addToast("error", "Failed to start job assessment.");
                    return;
                }

                const data = await response.json();
                const newJobId: string = data.jobId;

                setTrackedJobs(prev => ({
                    ...prev,
                    [jobPostId]: { jobId: newJobId, status: null },
                }));

                ensurePolling();
                pollJob(jobPostId, newJobId);
            } catch {
                addToast("error", "Failed to start job assessment.");
            }
        },
        [candidateProfileId, addToast, ensurePolling, pollJob]
    );

    const enqueueMany = useCallback(
        async (jobPostIds: string[]) => {
            await Promise.all(jobPostIds.map(jobPostId => enqueue(jobPostId)));
        },
        [enqueue]
    );

    const getStatus = useCallback((jobPostId: string) => trackedJobs[jobPostId]?.status ?? null, [trackedJobs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    return { getStatus, enqueue, enqueueMany, toasts, dismissToast };
}
