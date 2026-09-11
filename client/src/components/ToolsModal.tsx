import { useState } from "react";
import "./ToolsModal.css";

interface ToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
    const [resetting, setResetting] = useState<boolean>(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<boolean>(false);
    const [confirming, setConfirming] = useState<boolean>(false);

    const handleReset = async () => {
        setResetting(true);
        setResetError(null);
        setResetSuccess(false);

        try {
            const response = await fetch("/api/v1/tools/reset", {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = await response.json();
                const message = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
                throw new Error(message);
            }

            setResetSuccess(true);
            setConfirming(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to reset database";
            setResetError(message);
        } finally {
            setResetting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tools</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {resetSuccess ? (
                        <div className="success-message">
                            <p>Database reset successfully. Refresh the page to see the changes.</p>
                        </div>
                    ) : (
                        <div className="tools-section">
                            <div className="tool-card">
                                <div className="tool-header">
                                    <h3>Reset Database</h3>
                                </div>
                                <p className="tool-description">
                                    Reset deletes all data from the database, including job posts, job post details, job
                                    sources, candidate profiles, and job assessments. The schema is preserved so the
                                    application remains usable after reset. This action cannot be undone.
                                </p>

                                {resetError && (
                                    <div className="error-message">
                                        <p>{resetError}</p>
                                    </div>
                                )}

                                {!confirming ? (
                                    <button
                                        type="button"
                                        onClick={() => setConfirming(true)}
                                        className="button-danger"
                                        disabled={resetting}
                                    >
                                        Reset
                                    </button>
                                ) : (
                                    <div className="confirm-actions">
                                        <span className="confirm-text">Are you sure? This cannot be undone.</span>
                                        <div className="confirm-buttons">
                                            <button
                                                type="button"
                                                onClick={() => setConfirming(false)}
                                                className="button-secondary"
                                                disabled={resetting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="button-danger"
                                                disabled={resetting}
                                            >
                                                {resetting ? "Resetting..." : "Confirm Reset"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="close-button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ToolsModal;
