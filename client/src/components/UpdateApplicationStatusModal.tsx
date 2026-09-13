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

interface IAttachment {
    id: string;
    fileName: string;
}

interface IExistingApplication {
    id: string;
    status: JobApplicationStatus;
    attachments: IAttachment[];
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
): Promise<IExistingApplication | undefined> {
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
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
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
                    setAttachments(existing.attachments ?? []);
                } else {
                    setApplicationId(null);
                    setAttachments([]);
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

            // Stay open and switch into edit mode so the user can immediately set status/attachments.
            const created = await fetchExistingApplication(jobPostId);
            if (created) {
                setApplicationId(created.id);
                setStatus(created.status);
                setAttachments(created.attachments ?? []);
            }
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

    const handleUpload = async () => {
        if (!applicationId || !selectedFile) {
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const content = await selectedFile.arrayBuffer();
            const response = await fetch(`/api/v1/job-applications/${applicationId}/attachments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-File-Name": selectedFile.name,
                },
                body: content,
            });
            if (!response.ok) {
                throw new Error(`Failed to upload attachment: ${response.status}`);
            }

            const data = await response.json();
            setAttachments(prev => [...prev, data.attachment]);
            setSelectedFile(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload attachment");
        } finally {
            setUploading(false);
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
                        <>
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

                            <div className="form-group">
                                <label>Attachments</label>
                                {attachments.length > 0 ? (
                                    <ul className="attachments-list">
                                        {attachments.map(attachment => (
                                            <li key={attachment.id}>
                                                <a
                                                    href={`/api/v1/job-applications/${applicationId}/attachments/${attachment.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {attachment.fileName}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="attachments-empty">No attachments uploaded yet.</p>
                                )}

                                <div className="attachment-upload-row">
                                    <input
                                        type="file"
                                        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                                        disabled={uploading}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        className="button-secondary"
                                        disabled={!selectedFile || uploading}
                                    >
                                        {uploading ? "Uploading..." : "Upload"}
                                    </button>
                                </div>
                            </div>
                        </>
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
                            {applicationId ? "Cancel" : "Close"}
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
