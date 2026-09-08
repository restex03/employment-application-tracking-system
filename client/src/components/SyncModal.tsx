import React, { useState } from 'react';
import { IJobSource } from '../types/JobPost';
import './SyncModal.css';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobSources: IJobSource[];
    onSync: (sourceId?: string) => Promise<void>;
    syncLoading: boolean;
    syncError: string | null;
    syncSuccess: boolean;
}

function SyncModal({ 
    isOpen, 
    onClose, 
    jobSources, 
    onSync, 
    syncLoading, 
    syncError, 
    syncSuccess 
}: SyncModalProps) {
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const sourceId = selectedSourceId || undefined;
        await onSync(sourceId);
    };

    const handleReset = () => {
        setSelectedSourceId('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Sync Job Posts</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {syncSuccess ? (
                        <div className="success-message">
                            <p>✅ Job posts synced successfully!</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="sync-form">
                            <div className="form-group">
                                <label htmlFor="source-select">Select Company:</label>
                                <select
                                    id="source-select"
                                    value={selectedSourceId}
                                    onChange={(e) => setSelectedSourceId(e.target.value)}
                                    className="source-select"
                                >
                                    <option value="">All Companies</option>
                                    {jobSources.map((source) => (
                                        <option key={source.id} value={source.id}>
                                            {source.companyName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {syncError && (
                                <div className="error-message">
                                    <p>{syncError}</p>
                                </div>
                            )}

                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    onClick={handleReset}
                                    className="button-secondary"
                                    disabled={syncLoading}
                                >
                                    Reset
                                </button>
                                <button 
                                    type="submit" 
                                    className="button-primary"
                                    disabled={syncLoading}
                                >
                                    {syncLoading ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                        </form>
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

export default SyncModal;
