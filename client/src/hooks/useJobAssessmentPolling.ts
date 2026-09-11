import { useState, useEffect, useCallback, useRef } from "react";
import { JobQueueStatus } from "../types/JobAssessmentJob";

export interface ToastMessage {
    id: string;
    type: "success" | "error" | "info";
    message: string;
}

interface UseJobAssessmentPollingOptions {
    candidateProfileId: string;
    pollIntervalMs?: number;
}

interface UseJobAssessmentPollingResult {
    jobId: string | null;
    jobPostId: string | null;
    jobStatus: JobQueueStatus | null;
    enqueue: (jobPostId: string) => Promise<void>;
    toasts: ToastMessage[];
    dismissToast: (id: string) => void;
}

const POLL_INTERVAL_MS = 10_000;

export function useJobAssessmentPolling({
    candidateProfileId,
    pollIntervalMs = POLL_INTERVAL_MS,
}: UseJobAssessmentPollingOptions): UseJobAssessmentPollingResult {
    const [jobId, setJobId] = useState<string | null>(null);
    const [trackedJobPostId, setTrackedJobPostId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobQueueStatus | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const pollJobStatus = useCallback(
        async (id: string) => {
            try {
                const response = await fetch(`/api/v1/assessment-jobs/${id}`);
                if (!response.ok) {
                    return;
                }
                const data = await response.json();
                const status = data.status as JobQueueStatus;
                setJobStatus(status);

                if (status === "COMPLETED") {
                    stopPolling();
                    addToast("success", "Job assessment completed successfully.");
                } else if (status === "FAILED") {
                    stopPolling();
                    addToast("error", "Job assessment failed.");
                }
            } catch {
                // network errors are transient; keep polling
            }
        },
        [stopPolling, addToast]
    );

    const enqueue = useCallback(
        async (jobPostId: string) => {
            setJobStatus(null);
            setJobId(null);
            setTrackedJobPostId(jobPostId);
            stopPolling();

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
                setJobId(newJobId);

                // Start polling
                pollRef.current = setInterval(() => {
                    pollJobStatus(newJobId);
                }, pollIntervalMs);

                // Poll immediately (don't wait for the first interval)
                pollJobStatus(newJobId);
            } catch {
                addToast("error", "Failed to start job assessment.");
            }
        },
        [candidateProfileId, pollIntervalMs, stopPolling, addToast, pollJobStatus]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    return { jobId, jobPostId: trackedJobPostId, jobStatus, enqueue, toasts, dismissToast };
}
