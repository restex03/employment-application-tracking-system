import { useState } from "react";
import "./DismissJobModal.css";

interface DismissJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPostId: string;
    jobTitle: string;
    onDismissed: (jobPostId: string) => void;
}

function DismissJobModal({ isOpen, onClose, jobPostId, jobTitle, onDismissed }: DismissJobModalProps) {
    const [dismissing, setDismissing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleConfirm = async () => {
        setDismissing(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/job-posts/${jobPostId}/dismissed`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dismissed: true }),
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to dismiss job post: ${response.status}`);
            }

            onDismissed(jobPostId);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to dismiss job post");
        } finally {
            setDismissing(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content dismiss-job-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Dismiss Job</h2>
                    <button className="close-button" onClick={onClose} disabled={dismissing}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <p className="dismiss-job-confirmation">Are you sure you want to dismiss:</p>
                    <p className="dismiss-job-title">{jobTitle}?</p>
                    <p className="dismiss-job-hint">
                        <i>
                            Dismissed job posts are hidden from the table unless &quot;Show Dismissed&quot; is checked.
                        </i>
                    </p>
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="button-secondary" disabled={dismissing}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleConfirm} className="button-primary" disabled={dismissing}>
                        {dismissing ? "Dismissing..." : "Dismiss"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DismissJobModal;
