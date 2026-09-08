import React, { useState, useMemo } from "react";
import { useJobPosts } from "../hooks/useJobPosts";
import { useJobSources } from "../hooks/useJobSources";
import { useSyncJobPosts } from "../hooks/useSyncJobPosts";
import { IJobPost } from "../types/JobPost";
import JobPostModal from "../components/JobPostModal";
import SyncModal from "../components/SyncModal";
import "./JobPostsPage.css";

type SortableColumn = "company" | "requisitionId" | "title" | "locations" | "createdAt" | null;
type SortDirection = "asc" | "desc" | null;

interface FilterState {
    company: string;
    requisitionId: string;
    title: string;
    locations: string;
    createdAt: string;
}

function JobPostsPage() {
    const {
        jobPosts,
        totalCount,
        loading: jobPostsLoading,
        error: jobPostsError,
        pagination,
        setPage,
        setPageCount,
        refresh,
    } = useJobPosts();
    const { jobSources, getCompanyName, loading: sourcesLoading, error: sourcesError } = useJobSources();
    const {
        sync,
        loading: syncLoading,
        error: syncError,
        success: syncSuccess,
        reset: resetSync,
        clearError: clearSyncError,
    } = useSyncJobPosts();
    const [selectedJobPost, setSelectedJobPost] = useState<IJobPost | null>(null);
    const [isJobPostModalOpen, setIsJobPostModalOpen] = useState<boolean>(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterState>({
        company: "",
        requisitionId: "",
        title: "",
        locations: "",
        createdAt: "",
    });
    const [sortColumn, setSortColumn] = useState<SortableColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Check if either is loading
    const loading = jobPostsLoading || sourcesLoading;

    // Filter and sort the job posts
    const filteredAndSortedPosts = useMemo(() => {
        let result = [...jobPosts];

        // Apply filters
        if (filters.company) {
            result = result.filter(post =>
                getCompanyName(post.sourceId).toLowerCase().includes(filters.company.toLowerCase())
            );
        }
        if (filters.requisitionId) {
            result = result.filter(post =>
                (post.requisitionId || "").toLowerCase().includes(filters.requisitionId.toLowerCase())
            );
        }
        if (filters.title) {
            result = result.filter(post => post.title.toLowerCase().includes(filters.title.toLowerCase()));
        }
        if (filters.locations) {
            result = result.filter(post => {
                const locationsStr = formatLocations(post.locations).toLowerCase();
                return locationsStr.includes(filters.locations.toLowerCase());
            });
        }
        if (filters.createdAt) {
            result = result.filter(post => {
                const createdAtStr = formatDateForFilter(post.createdAt).toLowerCase();
                return createdAtStr.includes(filters.createdAt.toLowerCase());
            });
        }

        // Apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                let aValue: string;
                let bValue: string;

                switch (sortColumn) {
                    case "company":
                        aValue = getCompanyName(a.sourceId);
                        bValue = getCompanyName(b.sourceId);
                        break;
                    case "requisitionId":
                        aValue = a.requisitionId || "";
                        bValue = b.requisitionId || "";
                        break;
                    case "title":
                        aValue = a.title;
                        bValue = b.title;
                        break;
                    case "locations":
                        aValue = formatLocations(a.locations);
                        bValue = formatLocations(b.locations);
                        break;
                    case "createdAt":
                        aValue = a.createdAt;
                        bValue = b.createdAt;
                        break;
                    default:
                        return 0;
                }

                if (sortDirection === "asc") {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });
        }

        return result;
    }, [jobPosts, filters, sortColumn, sortDirection, getCompanyName]);

    const formatDateForFilter = (dateString: string | Date): string => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return String(dateString);
        }
    };

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            // Toggle direction if same column
            setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
        } else {
            // New column, default to ascending
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleFilterChange = (column: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [column]: value }));
    };

    const clearAllFilters = () => {
        setFilters({
            company: "",
            requisitionId: "",
            title: "",
            locations: "",
            createdAt: "",
        });
    };

    const getSortIndicator = (column: SortableColumn) => {
        if (sortColumn !== column) return null;
        if (sortDirection === "asc") return " ↑";
        if (sortDirection === "desc") return " ↓";
        return "";
    };

    const handleSync = async (sourceIds?: string[]) => {
        await sync(sourceIds);
    };

    const openSyncModal = () => {
        resetSync();
        setIsSyncModalOpen(true);
    };

    const closeSyncModal = () => {
        setIsSyncModalOpen(false);
    };

    const handleRowClick = (jobPost: IJobPost) => {
        setSelectedJobPost(jobPost);
        setIsJobPostModalOpen(true);
    };

    const closeModal = () => {
        setIsJobPostModalOpen(false);
        setSelectedJobPost(null);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    const formatLocations = (locations: unknown[] | undefined) => {
        if (!locations || locations.length === 0) return "N/A";

        // Try to extract location info
        const locationStrings = locations.map(loc => {
            if (typeof loc === "string") return loc;
            if (typeof loc === "object" && loc !== null) {
                const obj = loc as Record<string, unknown>;
                const parts = [obj.city as string, obj.state as string, obj.country as string].filter(Boolean);
                return parts.length > 0 ? parts.join(", ") : "Unknown";
            }
            return String(loc);
        });

        return locationStrings.join("; ");
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading job posts and sources...</p>
            </div>
        );
    }

    if (jobPostsError || sourcesError) {
        return (
            <div className="error-container">
                <p className="error-message">Error: {jobPostsError || sourcesError}</p>
                <button onClick={() => window.location.reload()} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="job-posts-page">
            <div className="page-header">
                <h2>Job Posts ({totalCount})</h2>
                <button onClick={openSyncModal} className="update-button" disabled={jobSources.length === 0}>
                    Sync
                </button>
            </div>

            {jobPosts.length === 0 ? (
                <p className="no-data">No job posts match your filters.</p>
            ) : (
                <div className="table-container">
                    <div className="filter-row">
                        <input
                            type="text"
                            placeholder="Filter Company..."
                            value={filters.company}
                            onChange={e => handleFilterChange("company", e.target.value)}
                            className="filter-input"
                        />
                        <input
                            type="text"
                            placeholder="Filter Req ID..."
                            value={filters.requisitionId}
                            onChange={e => handleFilterChange("requisitionId", e.target.value)}
                            className="filter-input"
                        />
                        <input
                            type="text"
                            placeholder="Filter Title..."
                            value={filters.title}
                            onChange={e => handleFilterChange("title", e.target.value)}
                            className="filter-input"
                        />
                        <input
                            type="text"
                            placeholder="Filter Locations..."
                            value={filters.locations}
                            onChange={e => handleFilterChange("locations", e.target.value)}
                            className="filter-input"
                        />
                        <input
                            type="text"
                            placeholder="Filter Created..."
                            value={filters.createdAt}
                            onChange={e => handleFilterChange("createdAt", e.target.value)}
                            className="filter-input"
                        />
                        <button onClick={clearAllFilters} className="clear-filters-button">
                            Clear
                        </button>
                    </div>
                    <div className="pagination-info">
                        <span>
                            Showing {jobPosts.length} of {totalCount} job posts
                        </span>
                    </div>
                    <table className="job-posts-table">
                        <thead>
                            <tr>
                                <th className="row-count">#</th>
                                <th onClick={() => handleSort("company")}>
                                    <div className="sortable-header">
                                        <span>Company</span>
                                        <span className="sort-icon">{getSortIndicator("company")}</span>
                                    </div>
                                </th>
                                <th onClick={() => handleSort("requisitionId")}>
                                    <div className="sortable-header">
                                        <span>Requisition ID</span>
                                        <span className="sort-icon">{getSortIndicator("requisitionId")}</span>
                                    </div>
                                </th>
                                <th onClick={() => handleSort("title")}>
                                    <div className="sortable-header">
                                        <span>Title</span>
                                        <span className="sort-icon">{getSortIndicator("title")}</span>
                                    </div>
                                </th>
                                <th>Detail Path</th>
                                <th onClick={() => handleSort("locations")}>
                                    <div className="sortable-header">
                                        <span>Locations</span>
                                        <span className="sort-icon">{getSortIndicator("locations")}</span>
                                    </div>
                                </th>
                                <th>Date Posted</th>
                                <th onClick={() => handleSort("createdAt")}>
                                    <div className="sortable-header">
                                        <span>Created At</span>
                                        <span className="sort-icon">{getSortIndicator("createdAt")}</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedPosts.map((jobPost, index) => (
                                <tr
                                    key={jobPost.id}
                                    onClick={() => handleRowClick(jobPost)}
                                    className="job-post-row"
                                    title="Click to view details"
                                >
                                    <td className="row-count">
                                        {(pagination.pageNumber - 1) * pagination.pageCount + index + 1}
                                    </td>
                                    <td>{getCompanyName(jobPost.sourceId)}</td>
                                    <td>{jobPost.requisitionId || "N/A"}</td>
                                    <td>{jobPost.title}</td>
                                    <td className="detail-path">{jobPost.detailPath}</td>
                                    <td>{formatLocations(jobPost.locations)}</td>
                                    <td>{jobPost.postedDaysAgo || "N/A"}</td>
                                    <td>{formatDate(jobPost.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-footer">
                        <div className="pagination-controls">
                            <select
                                value={pagination.pageCount}
                                onChange={e => setPageCount(Number(e.target.value))}
                                className="page-count-select"
                            >
                                <option value="10">10 per page</option>
                                <option value="25">25 per page</option>
                                <option value="50">50 per page</option>
                                <option value="100">100 per page</option>
                            </select>
                            <button
                                onClick={() => setPage(pagination.pageNumber - 1)}
                                disabled={pagination.pageNumber <= 1}
                                className="page-nav-button"
                            >
                                Previous
                            </button>
                            <span className="page-info">
                                Page {pagination.pageNumber} of {Math.ceil(totalCount / pagination.pageCount) || 1}
                            </span>
                            <button
                                onClick={() => setPage(pagination.pageNumber + 1)}
                                disabled={pagination.pageNumber >= Math.ceil(totalCount / pagination.pageCount)}
                                className="page-nav-button"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedJobPost && (
                <JobPostModal
                    isOpen={isJobPostModalOpen}
                    onClose={() => setIsJobPostModalOpen(false)}
                    jobPost={selectedJobPost}
                />
            )}

            <SyncModal
                isOpen={isSyncModalOpen}
                onClose={closeSyncModal}
                jobSources={jobSources}
                onSync={handleSync}
                onClearError={clearSyncError}
                syncLoading={syncLoading}
                syncError={syncError}
                syncSuccess={syncSuccess}
            />
        </div>
    );
}

export default JobPostsPage;
