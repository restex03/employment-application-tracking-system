import React, { useState, useMemo } from "react";
import { useJobPosts } from "../hooks/useJobPosts";
import { useJobSources } from "../hooks/useJobSources";
import { useSyncJobPosts } from "../hooks/useSyncJobPosts";
import { IJobPost } from "../types/JobPost";
import JobPostModal from "../components/JobPostModal";
import JobMatchDetailsModal from "../components/JobMatchDetailsModal";
import SyncModal from "../components/SyncModal";
import ToolsModal from "../components/ToolsModal";
import "./JobPostsPage.css";

type SortableColumn = "company" | "requisitionId" | "title" | "locations" | "daysOld" | "createdAt" | null;
type SortDirection = "asc" | "desc" | null;

interface FilterState {
    company: string;
    requisitionId: string;
    title: string;
    locations: string;
    daysOld: string;
}

function JobPostsPage() {
    const [filters, setFilters] = useState<FilterState>({
        company: "",
        requisitionId: "",
        title: "",
        locations: "",
        daysOld: "",
    });
    const {
        jobPosts,
        totalCount,
        loading: jobPostsLoading,
        error: jobPostsError,
        pagination,
        setPage,
        setPageCount,
    } = useJobPosts(undefined, {
        companyName: filters.company,
        requisitionId: filters.requisitionId,
        title: filters.title,
        location: filters.locations,
        daysOld: filters.daysOld,
    });
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
    const [detailLoading, setDetailLoading] = useState<boolean>(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [selectedJobPostForAssessment, setSelectedJobPostForAssessment] = useState<IJobPost | null>(null);
    const [isJobMatchModalOpen, setIsJobMatchModalOpen] = useState<boolean>(false);
    const [assessmentLoading, setAssessmentLoading] = useState<boolean>(false);
    const [assessmentError, setAssessmentError] = useState<string | null>(null);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState<boolean>(false);
    const [sortColumn, setSortColumn] = useState<SortableColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Sort the posts returned by the API.
    const filteredAndSortedPosts = useMemo(() => {
        let result = [...jobPosts];

        // Apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                if (sortColumn === "daysOld") {
                    const aValue = formatdaysOldSort(a.daysOld);
                    const bValue = formatdaysOldSort(b.daysOld);
                    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
                }

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
    }, [jobPosts, sortColumn, sortDirection, getCompanyName]);

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
        setPage(1);
    };

    const clearAllFilters = () => {
        setFilters({
            company: "",
            requisitionId: "",
            title: "",
            locations: "",
            daysOld: "",
        });
        setPage(1);
    };

    const getSortIndicator = (column: SortableColumn) => {
        if (sortColumn !== column) return null;
        if (sortDirection === "asc") return " ↑";
        if (sortDirection === "desc") return " ↓";
        return "";
    };

    const handleSync = async (sourceIds?: string[], searchText?: string) => {
        await sync(sourceIds, searchText);
        window.location.reload();
    };

    const openSyncModal = () => {
        resetSync();
        setIsSyncModalOpen(true);
    };

    const closeSyncModal = () => {
        setIsSyncModalOpen(false);
    };

    const fetchJobDetail = async (jobPost: IJobPost): Promise<IJobPost> => {
        setDetailLoading(true);
        setDetailError(null);

        try {
            // Try to get the job by ID first
            const getUrl = `/api/v1/job-posts/${jobPost.id}`;
            const getResponse = await fetch(getUrl);

            if (getResponse.ok) {
                const data: IJobPost = await getResponse.json();

                // If detail is undefined, sync the job detail
                if (!data.detail) {
                    const syncUrl = `/api/v1/job-posts/${jobPost.id}/sync`;
                    const syncResponse = await fetch(syncUrl, {
                        method: "POST",
                    });

                    if (!syncResponse.ok) {
                        throw new Error(`Failed to sync job detail: ${syncResponse.status}`);
                    }

                    // After successful sync, try to get the job again with a retry
                    const retryData = await fetchWithRetry(getUrl, 3, 1000);
                    return retryData;
                }

                return data;
            }

            // If 404, try to sync the job detail
            if (getResponse.status === 404) {
                const syncUrl = `/api/v1/job-posts/${jobPost.id}/sync`;
                const syncResponse = await fetch(syncUrl, {
                    method: "POST",
                });

                if (!syncResponse.ok) {
                    throw new Error(`Failed to sync job detail: ${syncResponse.status}`);
                }

                // After successful sync, try to get the job again with a retry
                const retryData = await fetchWithRetry(getUrl, 3, 1000);
                return retryData;
            }

            throw new Error(`Failed to fetch job detail: ${getResponse.status}`);
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : "Failed to fetch job detail");
            // Return the original jobPost without detail
            return jobPost;
        } finally {
            setDetailLoading(false);
        }
    };

    const fetchWithRetry = async (url: string, maxRetries: number, delayMs: number): Promise<IJobPost> => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const response = await fetch(url);
            if (response.ok) {
                const data: IJobPost = await response.json();
                if (data.detail) {
                    return data;
                }
            }
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        // If all retries fail, return the last response or throw
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch after retries: ${response.status}`);
        }
        return await response.json();
    };

    const handleRunAssessment = (jobPost: IJobPost) => {
        setSelectedJobPostForAssessment(jobPost);
        setIsJobMatchModalOpen(true);
    };

    const handleDetailsButtonClick = async (jobPost: IJobPost) => {
        // Fetch the job detail and open JobPostModal for Details button clicks
        const jobPostWithDetail = await fetchJobDetail(jobPost);
        setSelectedJobPost(jobPostWithDetail);
        setIsJobPostModalOpen(true);
    };

    const closeModal = () => {
        setIsJobPostModalOpen(false);
        setSelectedJobPost(null);
        setDetailError(null);
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

    const renderScoreIndicator = (score: number | undefined): React.ReactNode => {
        if (score === undefined) {
            return (
                <div className="score-indicator">
                    <div className="score-circle score-missing"></div>
                    <div className="score-label">Not Run</div>
                </div>
            );
        }

        let circleClass = "";
        let label = "";

        if (score >= 75) {
            circleClass = "score-circle score-high";
            label = "Good";
        } else if (score >= 50) {
            circleClass = "score-circle score-fair";
            label = "Fair";
        } else {
            circleClass = "score-circle score-poor";
            label = "Poor";
        }

        return (
            <div className="score-indicator">
                <div className={circleClass}></div>
                <div className="score-label">{label}</div>
            </div>
        );
    };

    if (sourcesLoading) {
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
            {detailLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Loading job details...</p>
                </div>
            )}
            <div className="page-header">
                <h2>Job Posts ({totalCount})</h2>
                <div className="header-actions">
                    <button onClick={openSyncModal} className="update-button" disabled={jobSources.length === 0}>
                        Sync
                    </button>
                    <button onClick={() => setIsToolsModalOpen(true)} className="tools-button">
                        Tools
                    </button>
                </div>
            </div>

            <div className="table-container" aria-busy={jobPostsLoading}>
                {jobPostsLoading && (
                    <div className="table-loading-overlay">
                        <div className="spinner"></div>
                        <span>Updating results...</span>
                    </div>
                )}
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
                        placeholder="Filter Days Old..."
                        value={filters.daysOld}
                        onChange={e => handleFilterChange("daysOld", e.target.value)}
                        className="filter-input"
                    />
                    <button onClick={clearAllFilters} className="clear-filters-button">
                        Clear
                    </button>
                </div>
                <div className="pagination-info">
                    <span>
                        Showing {filteredAndSortedPosts.length} of {totalCount} job posts
                    </span>
                </div>
                <table className="job-posts-table">
                    <thead>
                        <tr>
                            <th className="row-count">#</th>
                            <th className="score-column">Job Match</th>
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
                            <th>Remote Type</th>
                            <th>Detail Path</th>
                            <th onClick={() => handleSort("locations")}>
                                <div className="sortable-header">
                                    <span>Locations</span>
                                    <span className="sort-icon">{getSortIndicator("locations")}</span>
                                </div>
                            </th>
                            <th onClick={() => handleSort("daysOld")}>
                                <div className="sortable-header">
                                    <span>Days Old</span>
                                    <span className="sort-icon">{getSortIndicator("daysOld")}</span>
                                </div>
                            </th>
                            <th onClick={() => handleSort("createdAt")}>
                                <div className="sortable-header">
                                    <span>Created At</span>
                                    <span className="sort-icon">{getSortIndicator("createdAt")}</span>
                                </div>
                            </th>
                            <th>Evaluate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedPosts.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="no-data">
                                    No job posts match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedPosts.map((jobPost, index) => (
                                <tr key={jobPost.id} className="job-post-row" onClick={() => handleDetailsButtonClick(jobPost)}>
                                    <td className="row-count">
                                        {(pagination.pageNumber - 1) * pagination.pageCount + index + 1}
                                    </td>
                                    <td className="score-cell">{renderScoreIndicator(jobPost.score)}</td>
                                    <td>{getCompanyName(jobPost.sourceId)}</td>
                                    <td>{jobPost.requisitionId || "N/A"}</td>
                                    <td>{jobPost.title}</td>
                                    <td>{jobPost.remoteType || "N/A"}</td>
                                    <td className="detail-path">{jobPost.detailPath}</td>
                                    <td>{formatLocations(jobPost.locations)}</td>
                                    <td>{jobPost.daysOld || "N/A"}</td>
                                    <td>{formatDate(jobPost.createdAt)}</td>
                                    <td>
                                        <button
                                            className="run-assessment-button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleRunAssessment(jobPost);
                                            }}
                                        >
                                            &nbsp;▶&nbsp;
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
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

            {selectedJobPost && (
                <JobPostModal
                    key={selectedJobPost.id + (selectedJobPost.detail ? "-with-detail" : "")}
                    isOpen={isJobPostModalOpen}
                    onClose={closeModal}
                    jobPost={selectedJobPost}
                />
            )}

            {selectedJobPostForAssessment && (
                <JobMatchDetailsModal
                    key={selectedJobPostForAssessment.id}
                    isOpen={isJobMatchModalOpen}
                    onClose={() => {
                        setIsJobMatchModalOpen(false);
                        setSelectedJobPostForAssessment(null);
                        setAssessmentError(null);
                    }}
                    jobPostId={selectedJobPostForAssessment.id}
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

            <ToolsModal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} />
        </div>
    );
}

export default JobPostsPage;

function formatdaysOldSort(value: string | undefined): number {
    if (!value || value === "Unknown") {
        return Infinity;
    }
    if (value === "30+") {
        return 1000;
    }
    return parseInt(value, 10);
}
