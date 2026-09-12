import { useCallback, useEffect, useRef, useState } from "react";
import { IAssessmentJob, JobQueueStatus } from "../types/JobAssessmentJob";
import { JobQueuePollingManager } from "../services/JobQueuePollingManager";

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
const IN_FLIGHT_STATUSES: ReadonlySet<JobQueueStatus> = new Set(["QUEUED", "IN_PROGRESS"]);
const TERMINAL_STATUSES: ReadonlySet<JobQueueStatus> = new Set(["COMPLETED", "FAILED"]);

async function getJobById(jobId: string): Promise<IAssessmentJob | null> {
    const response = await fetch(`/api/v1/assessment-jobs/${jobId}`);
    if (!response.ok) {
        return null;
    }
    return (await response.json()) as IAssessmentJob;
}

function isJobTerminal(job: IAssessmentJob): boolean {
    return TERMINAL_STATUSES.has(job.status);
}

export function useJobAssessmentPolling({
    candidateProfileId,
    pollIntervalMs = POLL_INTERVAL_MS,
}: UseJobAssessmentPollingOptions): UseJobAssessmentPollingResult {
    const [trackedJobs, setTrackedJobs] = useState<Record<string, TrackedJob>>({});
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Maps in-flight jobId -> jobPostId so the manager's settlement callback (keyed by jobId)
    // can be attributed back to the job post the UI cares about.
    const jobPostIdByJobId = useRef<Map<string, string>>(new Map());

    const managerRef = useRef<JobQueuePollingManager<IAssessmentJob> | null>(null);
    if (!managerRef.current) {
        managerRef.current = new JobQueuePollingManager<IAssessmentJob>({
            getJobById,
            isTerminal: isJobTerminal,
            pollIntervalMs,
        });
    }

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

    // Registers a job for polling and wires up its settlement (toast + status update).
    const trackJob = useCallback(
        (jobPostId: string, jobId: string, initialStatus: JobQueueStatus) => {
            jobPostIdByJobId.current.set(jobId, jobPostId);
            setTrackedJobs(prev => ({
                ...prev,
                [jobPostId]: { jobId, status: initialStatus },
            }));

            managerRef.current?.add(jobId, (settledJobId, settledJob) => {
                const settledJobPostId = jobPostIdByJobId.current.get(settledJobId);
                jobPostIdByJobId.current.delete(settledJobId);
                if (!settledJobPostId) {
                    return;
                }

                setTrackedJobs(prev => {
                    const existing = prev[settledJobPostId];
                    // Ignore a stale settlement if a newer job was enqueued for this job post since.
                    if (!existing || existing.jobId !== settledJobId) {
                        return prev;
                    }
                    return { ...prev, [settledJobPostId]: { ...existing, status: settledJob.status } };
                });

                if (settledJob.status === "COMPLETED") {
                    addToast("success", "Job assessment completed successfully.");
                } else {
                    addToast("error", "Job assessment failed.");
                }
            });
        },
        [addToast]
    );

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

                trackJob(jobPostId, newJobId, "QUEUED");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error("Failed to start job assessment:", errorMessage);
                addToast("error", "Failed to start job assessment: " + errorMessage);
            }
        },
        [candidateProfileId, addToast, trackJob]
    );

    const enqueueMany = useCallback(
        async (jobPostIds: string[]) => {
            await Promise.all(jobPostIds.map(jobPostId => enqueue(jobPostId)));
        },
        [enqueue]
    );

    const getStatus = useCallback((jobPostId: string) => trackedJobs[jobPostId]?.status ?? null, [trackedJobs]);

    // On mount, pick up any jobs already in flight (e.g. from before a page refresh) and resume polling them.
    useEffect(() => {
        const controller = new AbortController();

        const hydrateActiveJobs = async () => {
            try {
                const response = await fetch("/api/v1/assessment-jobs", { signal: controller.signal });
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const jobs: IAssessmentJob[] = data.jobs ?? [];

                for (const job of jobs) {
                    if (job.candidateProfileId === candidateProfileId && IN_FLIGHT_STATUSES.has(job.status)) {
                        trackJob(job.jobPostId, job.id, job.status);
                    }
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
                console.error("Failed to load active job assessments:", error);
            }
        };

        void hydrateActiveJobs();

        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; trackJob/candidateProfileId are stable in practice
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        const manager = managerRef.current;
        return () => {
            manager?.removeAll();
        };
    }, []);

    return { getStatus, enqueue, enqueueMany, toasts, dismissToast };
}
