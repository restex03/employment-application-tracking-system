import React, { useState, useMemo, useEffect, useRef } from "react";
import { useJobPosts } from "../hooks/useJobPosts";
import { useJobSources } from "../hooks/useJobSources";
import { useSyncJobPosts } from "../hooks/useSyncJobPosts";
import { useSyncJobsStatus } from "../hooks/useSyncJobsStatus";
import { useJobAssessmentPolling } from "../hooks/useJobAssessmentPolling";
import { IJobPostData, JobApplicationStatus, JobPostSortBy } from "../types/JobPost";
import JobPostModal from "../components/JobPostModal";
import SyncModal from "../components/SyncModal";
import ToolsModal from "../components/ToolsModal";
import ToastContainer from "../components/ToastContainer";
import { formatDate } from "../services/formatters";
import { getSortIndicator } from "../services/sortHelpers";
import { postedDateSince } from "../services/postedDateFilters";
import { getApplicationStatusColor, getScoreCategory } from "../services/statusColors";
import "./JobPostsPage.css";

const CANDIDATE_PROFILE_ID = "russell-estes";

type SortableColumn = JobPostSortBy;

interface FilterState {
    company: string;
    requisitionId: string;
    title: string;
    locations: string;
    postedSince: string;
    jobMatchScore: string;
    applicationStatus: string;
}

function JobPostsPage() {
    const [filters, setFilters] = useState<FilterState>({
        company: "",
        requisitionId: "",
        title: "",
        locations: "",
        postedSince: "",
        jobMatchScore: "",
        applicationStatus: "",
    });
    const postedDate = useMemo(
        () => filters.postedSince === "" ? "" : postedDateSince(Number(filters.postedSince)),
        [filters.postedSince]
    );
    const [sortColumn, setSortColumn] = useState<SortableColumn>("postedDate");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
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
        postedDate,
        jobMatchScore: filters.jobMatchScore,
        applicationStatus: filters.applicationStatus,
        sortBy: sortColumn,
        sortDirection,
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
    const {
        initialCheckComplete: syncStatusCheckComplete,
        isSyncing,
        activeSyncJobCount,
        startPolling: startSyncPolling,
    } = useSyncJobsStatus();
    const [selectedJobPost, setSelectedJobPost] = useState<IJobPostData | null>(null);
    const [isJobPostModalOpen, setIsJobPostModalOpen] = useState<boolean>(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);
    const [_detailError, setDetailError] = useState<string | null>(null);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState<boolean>(false);
    const {
        getStatus: getAssessmentStatus,
        enqueue: enqueueAssessment,
        enqueueMany: enqueueAssessments,
        activeJobCount: activeAssessmentJobCount,
        toasts: assessmentToasts,
        dismissToast: dismissAssessmentToast,
    } = useJobAssessmentPolling({ candidateProfileId: CANDIDATE_PROFILE_ID });
    const [selectedJobPostIds, setSelectedJobPostIds] = useState<Set<string>>(new Set());
    const selectAllRef = useRef<HTMLInputElement>(null);

    // Only show the polled status when it corresponds to the currently open job post.
    const modalJobStatus = selectedJobPost ? getAssessmentStatus(selectedJobPost.id) : null;

    const allVisibleSelected =
        jobPosts.length > 0 && jobPosts.every(jp => selectedJobPostIds.has(jp.id));
    const someVisibleSelected = jobPosts.some(jp => selectedJobPostIds.has(jp.id));

    // Reflect a partial selection of the current page in the header checkbox.
    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
        }
    }, [someVisibleSelected, allVisibleSelected]);

    const handleSelectAllVisible = (checked: boolean) => {
        const visibleIds = jobPosts.map(jp => jp.id);
        setSelectedJobPostIds(prev => {
            const next = new Set(prev);
            if (checked) {
                visibleIds.forEach(id => next.add(id));
            } else {
                visibleIds.forEach(id => next.delete(id));
            }
            return next;
        });
    };

    const handleToggleJobPostSelection = (jobPostId: string, checked: boolean) => {
        setSelectedJobPostIds(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(jobPostId);
            } else {
                next.delete(jobPostId);
            }
            return next;
        });
    };

    const handleRunSelectedAssessments = () => {
        if (selectedJobPostIds.size === 0) {
            return;
        }
        enqueueAssessments(Array.from(selectedJobPostIds));
    };

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
        setPage(1);
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
            postedSince: "",
            jobMatchScore: "",
            applicationStatus: "",
        });
        setPage(1);
    };

    const getSortIndicatorFor = (column: SortableColumn) =>
        column ? getSortIndicator(column, sortColumn, sortDirection) : null;

    const handleSync = async (sourceIds?: string[], searchText?: string) => {
        const result = await sync(sourceIds, searchText);
        if (result.success) {
            startSyncPolling();
        }
        window.location.reload();
    };

    const handleResetClose = async () => {
        setIsToolsModalOpen(false);
        window.location.reload();
    };

    const openSyncModal = () => {
        resetSync();
        setIsSyncModalOpen(true);
    };

    const closeSyncModal = () => {
        setIsSyncModalOpen(false);
    };

    const fetchJobDetail = async (jobPost: IJobPostData): Promise<IJobPostData> => {
        setDetailLoading(true);
        setDetailError(null);

        try {
            // Try to get the job by ID first
            const getUrl = `/api/v1/job-posts/${jobPost.id}`;
            const getResponse = await fetch(getUrl);

            if (getResponse.ok) {
                const data: IJobPostData = await getResponse.json();
                // If detail is undefined, sync the job detail
                if (!data.detail) {
                    const syncUrl = `/api/v1/job-post-syncs/${jobPost.id}`;
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
                const syncUrl = `/api/v1/job-post-syncs/${jobPost.id}`;
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

    const fetchWithRetry = async (url: string, maxRetries: number, delayMs: number): Promise<IJobPostData> => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const response = await fetch(url);
            if (response.ok) {
                const data: IJobPostData = await response.json();
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

    const openJobPostModal = async (jobPost: IJobPostData) => {
        const jobPostWithDetail = await fetchJobDetail(jobPost);
        setSelectedJobPost(jobPostWithDetail);
        setIsJobPostModalOpen(true);
    };

    const handleDetailsButtonClick = (jobPost: IJobPostData) => {
        openJobPostModal(jobPost);
    };

    const closeModal = () => {
        setIsJobPostModalOpen(false);
        setSelectedJobPost(null);
        setDetailError(null);
    };

    const formatApplicationStatus = (status: JobApplicationStatus): string =>
        status.charAt(0) + status.slice(1).toLowerCase();

    const renderScoreIndicator = (score: number | undefined): React.ReactNode => {
        const category = getScoreCategory(score);
        const labels: Record<string, string> = {
            high: "Good",
            fair: "Fair",
            poor: "Poor",
            missing: "Not Run",
        };

        return (
            <div className="score-indicator">
                <div className={`score-circle score-${category}`}></div>
                <div className="score-label">{labels[category]}</div>
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
                    {activeAssessmentJobCount > 0 && (
                        <span className="active-jobs-indicator" title="Job assessments currently being processed">
                            <span className="active-jobs-spinner"></span>
                            {activeAssessmentJobCount} assessment{activeAssessmentJobCount === 1 ? "" : "s"} running
                        </span>
                    )}
                    {activeSyncJobCount > 0 && (
                        <span className="active-jobs-indicator" title="Job post syncs currently being processed">
                            <span className="active-jobs-spinner"></span>
                            {activeSyncJobCount} sync job{activeSyncJobCount === 1 ? "" : "s"} running
                        </span>
                    )}
                    <button
                        onClick={handleRunSelectedAssessments}
                        className="sync-button"
                        disabled={selectedJobPostIds.size === 0}
                    >
                        Run Assessments ({selectedJobPostIds.size})
                    </button>
                    <button
                        onClick={openSyncModal}
                        className="sync-button"
                        disabled={!syncStatusCheckComplete || isSyncing || jobSources.length === 0}
                        title={isSyncing ? "Sync is already running. Please wait for it to finish." : undefined}
                    >
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
                    <select
                        value={filters.postedSince}
                        onChange={e => handleFilterChange("postedSince", e.target.value)}
                        className="filter-input"
                        aria-label="Filter Posted Date"
                    >
                        <option value="">Posted Date: All</option>
                        <option value="0">Since Today</option>
                        <option value="1">Since Yesterday</option>
                        <option value="7">Last 7 days</option>
                        <option value="14">Last 14 days</option>
                        <option value="21">Last 21 days</option>
                        <option value="30">Last 30 days</option>
                    </select>
                    <select
                        value={filters.jobMatchScore}
                        onChange={e => handleFilterChange("jobMatchScore", e.target.value)}
                        className="filter-input"
                        aria-label="Filter Job Match"
                    >
                        <option value="">Job Match Score: All</option>
                        <option value="0">Job Match Score: &gt;=0</option>
                        <option value="25">Job Match Score: &gt;=25</option>
                        <option value="50">Job Match Score: &gt;=50</option>
                        <option value="60">Job Match Score: &gt;=60</option>
                        <option value="70">Job Match Score: &gt;=70</option>
                        <option value="80">Job Match Score: &gt;=80</option>
                        <option value="85">Job Match Score: &gt;=85</option>
                        <option value="90">Job Match Score: &gt;=90</option>
                        <option value="95">Job Match Score: &gt;=95</option>
                        <option value="100">Job Match Score: 100</option>
                    </select>
                    <select
                        value={filters.applicationStatus}
                        onChange={e => handleFilterChange("applicationStatus", e.target.value)}
                        className="filter-input"
                        aria-label="Filter Application Status"
                    >
                        <option value="">Application Status: All</option>
                        <option value="NONE">Application Status: None</option>
                        <option value={JobApplicationStatus.Applied}>Application Status: Applied</option>
                        <option value={JobApplicationStatus.Interview}>Application Status: Interview</option>
                        <option value={JobApplicationStatus.Offer}>Application Status: Offer</option>
                        <option value={JobApplicationStatus.Rejected}>Application Status: Rejected</option>
                    </select>
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
                            <th className="select-column">
                                <input
                                    type="checkbox"
                                    ref={selectAllRef}
                                    checked={allVisibleSelected}
                                    onChange={e => handleSelectAllVisible(e.target.checked)}
                                    title="Select all on this page"
                                />
                            </th>
                            <th className="score-column">Job Match</th>
                            <th>Application Status</th>
                            <th className="sortable-column" onClick={() => handleSort("companyName")}>
                                <div className="sortable-header">
                                    <span>Company</span>
                                    <span className="sort-icon">{getSortIndicatorFor("companyName")}</span>
                                </div>
                            </th>
                            <th className="sortable-column" onClick={() => handleSort("requisitionId")}>
                                <div className="sortable-header">
                                    <span>Requisition ID</span>
                                    <span className="sort-icon">{getSortIndicatorFor("requisitionId")}</span>
                                </div>
                            </th>
                            <th className="sortable-column" onClick={() => handleSort("title")}>
                                <div className="sortable-header">
                                    <span>Title</span>
                                    <span className="sort-icon">{getSortIndicatorFor("title")}</span>
                                </div>
                            </th>
                            <th>Detail Path</th>
                            <th>Locations</th>
                            <th className="sortable-column" onClick={() => handleSort("postedDate")}>
                                <div className="sortable-header">
                                    <span>Posted Date</span>
                                    <span className="sort-icon">{getSortIndicatorFor("postedDate")}</span>
                                </div>
                            </th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobPosts.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="no-data">
                                    {totalCount === 0 && Object.values(filters).every(value => !value)
                                        ? isSyncing
                                            ? "No job posts yet. A sync is currently running and the Sync button is disabled until it completes \u2014 refresh the page to check for new results."
                                            : "No job posts yet. Click Sync to fetch job posts."
                                        : "No job posts match your filters."}
                                </td>
                            </tr>
                        ) : (
                            jobPosts.map((jobPost, index) => (
                                <tr key={jobPost.id} className="job-post-row">
                                    <td className="row-count">
                                        {(pagination.pageNumber - 1) * pagination.pageCount + index + 1}
                                    </td>
                                    <td className="select-cell">
                                        <input
                                            type="checkbox"
                                            checked={selectedJobPostIds.has(jobPost.id)}
                                            onChange={e => handleToggleJobPostSelection(jobPost.id, e.target.checked)}
                                        />
                                    </td>
                                    <td className="score-cell">{renderScoreIndicator(jobPost.requirementMatchScore)}</td>
                                    <td>
                                        {(() => {
                                            const status = jobPost.applicationStatus;
                                            return (
                                                <span
                                                    className="application-status-badge"
                                                    style={{
                                                        backgroundColor:
                                                            status === undefined
                                                                ? "transparent"
                                                                : getApplicationStatusColor(status),
                                                    }}
                                                >
                                                    {status === undefined
                                                        ? "transparent"
                                                        : formatApplicationStatus(status)}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td>{getCompanyName(jobPost.sourceId)}</td>
                                    <td>{jobPost.requisitionId || "N/A"}</td>
                                    <td>{jobPost.title}</td>
                                    <td className="detail-path">{jobPost.detailPath}</td>
                                    <td>
                                        {jobPost.locations?.length ? (
                                            <ul className="job-post-locations">
                                                {jobPost.locations.map((location, index) => (
                                                    <li key={index}>{location}</li>
                                                ))}
                                            </ul>
                                        ) : "N/A"}
                                    </td>
                                    <td>{formatDate(jobPost.postedDate)}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="details-button"
                                            title="View job details"
                                            aria-label="View job details"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDetailsButtonClick(jobPost);
                                            }}
                                        >
                                            <svg className="details-icon" viewBox="0 0 24 24" aria-hidden="true">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="11" x2="12" y2="16" />
                                                <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
                                            </svg>
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
                    jobStatus={modalJobStatus}
                    onRunAssessment={() => enqueueAssessment(selectedJobPost.id)}
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

            <ToolsModal isOpen={isToolsModalOpen} onClose={handleResetClose} />

            <ToastContainer toasts={assessmentToasts} onDismiss={dismissAssessmentToast} />
        </div>
    );
}

export default JobPostsPage;
