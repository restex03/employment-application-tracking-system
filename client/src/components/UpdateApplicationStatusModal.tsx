import { useEffect, useState } from "react";
import { JobApplicationStatus } from "../types/JobPost";
import "./UpdateApplicationStatusModal.css";

interface UpdateApplicationStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPostId: string;
    jobTitle: string;
    onStatusSaved: (status: JobApplicationStatus) => void;
}

const STATUS_OPTIONS: JobApplicationStatus[] = [
    JobApplicationStatus.Applied,
    JobApplicationStatus.Review,
    JobApplicationStatus.Interview,
    JobApplicationStatus.Offer,
    JobApplicationStatus.Rejected,
];

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
    [JobApplicationStatus.Applied]: "Applied",
    [JobApplicationStatus.Review]: "Review",
    [JobApplicationStatus.Interview]: "Interview",
    [JobApplicationStatus.Offer]: "Offer",
    [JobApplicationStatus.Rejected]: "Rejected",
};

async function fetchExistingApplication(
    jobPostId: string,
    signal?: AbortSignal
): Promise<{ id: string; status: JobApplicationStatus } | undefined> {
    const response = await fetch(`/api/v1/job-applications/job/${jobPostId}`, { signal });
    if (response.status === 404) {
        return undefined;
    }
    if (!response.ok) {
        throw new Error(`Failed to load application status: ${response.status}`);
    }
    const data = await response.json();
    return data.job;
}

function UpdateApplicationStatusModal({
    isOpen,
    onClose,
    jobPostId,
    jobTitle,
    onStatusSaved,
}: UpdateApplicationStatusModalProps) {
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [status, setStatus] = useState<JobApplicationStatus>(JobApplicationStatus.Applied);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setError(null);

        const load = async () => {
            try {
                const existing = await fetchExistingApplication(jobPostId, controller.signal);
                if (existing) {
                    setApplicationId(existing.id);
                    setStatus(existing.status);
                } else {
                    setApplicationId(null);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                setError(err instanceof Error ? err.message : "Failed to load application status");
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            controller.abort();
        };
    }, [isOpen, jobPostId]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/job-applications/job/${jobPostId}`, { method: "POST" });
            if (!response.ok) {
                throw new Error(`Failed to create job application: ${response.status}`);
            }

            onStatusSaved(JobApplicationStatus.Applied);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create job application");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!applicationId) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/job-applications/${applicationId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                throw new Error(`Failed to update application status: ${response.status}`);
            }

            onStatusSaved(status);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save application status");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Update Application Status</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    <p className="status-modal-job-title">{jobTitle}</p>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading application status...</p>
                        </div>
                    ) : applicationId ? (
                        <div className="form-group">
                            <label htmlFor="application-status">Status</label>
                            <select
                                id="application-status"
                                value={status}
                                onChange={e => setStatus(e.target.value as JobApplicationStatus)}
                                className="filter-input"
                            >
                                {STATUS_OPTIONS.map(option => (
                                    <option key={option} value={option}>
                                        {STATUS_LABELS[option]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="status-modal-empty-state">
                            No application has been created for this job post yet.
                        </p>
                    )}

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="button-secondary" disabled={saving}>
                            Cancel
                        </button>
                        {!loading &&
                            (applicationId ? (
                                <button type="button" onClick={handleSave} className="button-primary" disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="button-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Creating..." : "Create Application"}
                                </button>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdateApplicationStatusModal;
