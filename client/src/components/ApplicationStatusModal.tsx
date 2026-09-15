import { useEffect, useMemo, useRef, useState } from "react";
import { JobApplicationStatus } from "../types/JobPost";
import { formatDate } from "../services/formatters";
import { getSortIndicator } from "../services/sortHelpers";
import "./ApplicationStatusModal.css";

interface ApplicationStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPostId: string;
    jobTitle: string;
    onStatusSaved: (status: JobApplicationStatus) => void;
}

interface IAttachment {
    id: string;
    fileName: string;
    dateAdded: string;
}

interface IExistingApplication {
    id: string;
    status: JobApplicationStatus;
    notes: string;
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

type SortableColumn = "fileName" | "dateAdded";
type SortDirection = "asc" | "desc";

function ApplicationStatusModal({ isOpen, onClose, jobPostId, jobTitle, onStatusSaved }: ApplicationStatusModalProps) {
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [status, setStatus] = useState<JobApplicationStatus>(JobApplicationStatus.Applied);
    const [applicationNotes, setApplicationNotes] = useState<string>("");
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<SortableColumn>("dateAdded");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [initialStatus, setInitialStatus] = useState<JobApplicationStatus | null>(null);
    const [initialNotes, setInitialNotes] = useState<string | null>(null);
    const [initialAttachments, setInitialAttachments] = useState<IAttachment[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    setApplicationNotes(existing.notes ?? "");
                    setAttachments(existing.attachments ?? []);
                    setInitialStatus(existing.status);
                    setInitialNotes(existing.notes ?? "");
                    setInitialAttachments(existing.attachments ?? []);
                } else {
                    setApplicationId(null);
                    setStatus(JobApplicationStatus.Applied);
                    setApplicationNotes("");
                    setAttachments([]);
                    setInitialStatus(JobApplicationStatus.Applied);
                    setInitialNotes("");
                    setInitialAttachments([]);
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

    const sortedAttachments = useMemo(() => {
        const sorted = [...attachments];
        sorted.sort((a, b) => {
            let cmp = 0;
            if (sortColumn === "dateAdded") {
                cmp = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
            } else {
                cmp = a[sortColumn].localeCompare(b[sortColumn], undefined, { sensitivity: "base" });
            }
            return sortDirection === "asc" ? cmp : -cmp;
        });
        return sorted;
    }, [attachments, sortColumn, sortDirection]);

    const hasChanges = useMemo(() => {
        if (initialStatus === null || initialNotes === null || initialAttachments === null) {
            return false;
        }
        return (
            status !== initialStatus ||
            applicationNotes !== initialNotes ||
            JSON.stringify(attachments) !== JSON.stringify(initialAttachments)
        );
    }, [status, applicationNotes, attachments, initialStatus, initialNotes, initialAttachments]);

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
                setApplicationNotes(created.notes ?? "");
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
                body: JSON.stringify({ status, notes: applicationNotes }),
            });
            if (!response.ok) {
                throw new Error(`Failed to update application status: ${response.status}`);
            }

            onStatusSaved(status);
            // Update initial state to match current state after save
            setInitialStatus(status);
            setInitialNotes(applicationNotes);
            setInitialAttachments(attachments);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save application status");
        } finally {
            setSaving(false);
        }
    };

    const refreshApplication = async () => {
        const existing = await fetchExistingApplication(jobPostId);
        if (existing) {
            setApplicationId(existing.id);
            setStatus(existing.status);
            setApplicationNotes(existing.notes ?? "");
            setAttachments(existing.attachments ?? []);
        }
    };

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleFileSelect = async (file: File | null) => {
        if (!applicationId || !file) {
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const content = await file.arrayBuffer();
            const response = await fetch(`/api/v1/job-applications/${applicationId}/attachments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-File-Name": file.name,
                },
                body: content,
            });
            if (!response.ok) {
                throw new Error(`Failed to upload attachment: ${response.status}`);
            }

            await refreshApplication();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload attachment");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };



    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Application Status</h2>
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
                                <label htmlFor="application-notes">Notes</label>
                                <textarea
                                    id="application-notes"
                                    className="filter-input application-notes-textarea"
                                    value={applicationNotes}
                                    onChange={e => setApplicationNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Add any notes about this application..."
                                />
                            </div>

                            <div className="form-group">
                                <div className="attachments-label-row">
                                    <label>Attachments</label>
                                    <button
                                        type="button"
                                        className="attachment-add-button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        title="Add attachment"
                                    >
                                        {uploading ? "..." : "+"}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="attachment-file-input-hidden"
                                        onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
                                        disabled={uploading}
                                    />
                                </div>
                                <p className="attachments-description">
                                    Upload anything related to this job post or the application process, such as
                                    resumes, cover letters, emails, or notes.
                                </p>
                                {attachments.length > 0 ? (
                                    <div className="attachments-table-container">
                                        <table className="attachments-table">
                                            <thead>
                                                <tr>
                                                    <th className="row-count">#</th>
                                                    <th onClick={() => handleSort("fileName")}>
                                                        <div className="sortable-header">
                                                            <span>File</span>
                                                            <span className="sort-icon">
                                                                {getSortIndicator(
                                                                    "fileName",
                                                                    sortColumn,
                                                                    sortDirection
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort("dateAdded")}>
                                                        <div className="sortable-header">
                                                            <span>Date Added</span>
                                                            <span className="sort-icon">
                                                                {getSortIndicator(
                                                                    "dateAdded",
                                                                    sortColumn,
                                                                    sortDirection
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedAttachments.map((attachment, index) => (
                                                    <tr key={attachment.id} className="attachments-table-row">
                                                        <td className="row-count">{index + 1}</td>
                                                        <td className="attachments-table-file-cell">
                                                            <a
                                                                href={`/api/v1/job-applications/${applicationId}/attachments/${attachment.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {attachment.fileName}
                                                            </a>
                                                        </td>
                                                        <td className="attachments-table-date-cell">
                                                            {formatDate(attachment.dateAdded, "datetimeSeconds", "")}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="attachments-empty">No attachments uploaded yet.</p>
                                )}
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
                            {"Close"}
                        </button>
                        {!loading &&
                            (applicationId ? (
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="button-primary"
                                    disabled={saving || !hasChanges}
                                >
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

export default ApplicationStatusModal;
