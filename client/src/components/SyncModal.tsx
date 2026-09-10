import React, { useState, useMemo, useRef, useEffect } from "react";
import { IJobSource } from "../types/JobPost";
import "./SyncModal.css";

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobSources: IJobSource[];
    onSync: (sourceIds?: string[], searchText?: string) => Promise<void>;
    onClearError: () => void;
    syncLoading: boolean;
    syncError: string | null;
    syncSuccess: boolean;
}

type SortOrder = "asc" | "desc" | null;

function SyncModal({
    isOpen,
    onClose,
    jobSources,
    onSync,
    onClearError,
    syncLoading,
    syncError,
    syncSuccess,
}: SyncModalProps) {
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
    const [filterText, setFilterText] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    // Filter and sort the sources
    const filteredAndSortedSources = useMemo(() => {
        let result = [...jobSources];

        // Filter by name
        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            result = result.filter(source => source.companyName.toLowerCase().includes(lowerFilter));
        }

        // Sort by name
        if (sortOrder) {
            result.sort((a, b) => {
                const comparison = a.companyName.localeCompare(b.companyName);
                return sortOrder === "asc" ? comparison : -comparison;
            });
        } else {
            result.sort((a, b) => a.companyName.localeCompare(b.companyName));
        }

        return result;
    }, [jobSources, filterText, sortOrder]);

    const selectAllRef = useRef<HTMLInputElement>(null);

    // Handle selection of all visible items
    const allSelected =
        filteredAndSortedSources.length > 0 &&
        filteredAndSortedSources.every(source => selectedSourceIds.includes(source.id));

    const someSelected = filteredAndSortedSources.some(source => selectedSourceIds.includes(source.id));

    // Update indeterminate state when selection changes
    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someSelected && !allSelected;
        }
    }, [allSelected, someSelected]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = filteredAndSortedSources.map(source => source.id);
            setSelectedSourceIds([...new Set([...selectedSourceIds, ...allIds])]);
        } else {
            const filteredIds = filteredAndSortedSources.map(source => source.id);
            setSelectedSourceIds(selectedSourceIds.filter(id => !filteredIds.includes(id)));
        }
    };

    const handleSelectOne = (sourceId: string, checked: boolean) => {
        if (checked) {
            setSelectedSourceIds([...new Set([...selectedSourceIds, sourceId])]);
        } else {
            setSelectedSourceIds(selectedSourceIds.filter(id => id !== sourceId));
        }
    };

    const handleSort = () => {
        const newSortOrder: SortOrder = sortOrder === null ? "asc" : sortOrder === "asc" ? "desc" : null;
        setSortOrder(newSortOrder);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSync(selectedSourceIds.length > 0 ? selectedSourceIds : undefined, searchText || undefined);
    };

    const handleReset = () => {
        setSelectedSourceIds([]);
        setFilterText("");
        setSearchText("");
        setSortOrder(null);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                                <label htmlFor="search-text">
                                    Search Query:
                                    <span
                                        className="search-query-tooltip"
                                        title="The search query is sent to each job source and filters results before they are fetched. Providing a query significantly reduces the number of jobs pulled from each source, which speeds up syncing and avoids pulling irrelevant listings."
                                    >
                                        &nbsp;(?)
                                    </span>
                                </label>
                                <input
                                    id="search-text"
                                    type="text"
                                    placeholder="Search query (e.g. software engineer)"
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    className="filter-input search-query-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Select Companies:</label>
                                <div className="filter-row">
                                    <input
                                        type="text"
                                        placeholder="Filter by company name..."
                                        value={filterText}
                                        onChange={e => setFilterText(e.target.value)}
                                        className="filter-input"
                                    />
                                </div>
                                <div className="sources-table-container">
                                    <table className="sources-table">
                                        <thead>
                                            <tr>
                                                <th className="select-all-cell">
                                                    <input
                                                        type="checkbox"
                                                        ref={selectAllRef}
                                                        checked={allSelected}
                                                        onChange={e => handleSelectAll(e.target.checked)}
                                                        className="select-all-checkbox"
                                                        title="Select all"
                                                    />
                                                </th>
                                                <th onClick={handleSort} className="sortable-header">
                                                    <span>Company Name</span>
                                                    <span className="sort-icon">
                                                        {sortOrder === "asc" ? " ↑" : sortOrder === "desc" ? " ↓" : ""}
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedSources.map(source => (
                                                <tr key={source.id} className="source-row">
                                                    <td className="checkbox-cell">
                                                        <input
                                                            type="checkbox"
                                                            value={source.id}
                                                            checked={selectedSourceIds.includes(source.id)}
                                                            onChange={e => handleSelectOne(source.id, e.target.checked)}
                                                            className="source-checkbox"
                                                        />
                                                    </td>
                                                    <td className="name-cell">{source.companyName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredAndSortedSources.length === 0 && (
                                        <p className="no-results">No companies match your filter</p>
                                    )}
                                </div>
                                <p className="select-hint">
                                    Select one or more companies, or leave all unchecked to sync all companies
                                </p>
                            </div>

                            {syncError && (
                                <div className="error-message">
                                    <p>{syncError}</p>
                                    <button type="button" onClick={onClearError} className="error-dismiss">
                                        &times;
                                    </button>
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
                                <button type="submit" className="button-primary" disabled={syncLoading}>
                                    {syncLoading ? "Syncing..." : "Sync Now"}
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
