import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { IJobPostData } from "../types/JobPost";
import { IJobAssessment, JobAssessmentReviewStatus } from "../types/JobAssessment";
import { JobQueueStatus } from "../types/JobAssessmentJob";
import { formatDate, formatLocation, formatList } from "../services/formatters";

import "./JobPostModal.css";
import { getMatchTypeColor, getAssessmentStatusColor, getScreenDispositionColor } from "../services/statusColors";
import ApplicationStatusPanel from "./ApplicationStatusPanel";

interface JobPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPost: IJobPostData;
    jobStatus: JobQueueStatus | null;
    onRunAssessment: () => void;
}

const CANDIDATE_PROFILE_ID = "russell-estes";

function JobPostModal({ isOpen, onClose, jobPost, jobStatus, onRunAssessment }: JobPostModalProps) {
    const [assessment, setAssessment] = useState<IJobAssessment | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [reviewStatus, setReviewStatus] = useState<JobAssessmentReviewStatus | null>(null);
    const [savingReviewStatus, setSavingReviewStatus] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"details" | "application" | "assessment">("details");

    // Fetch the assessment on open, and again once a newly queued job reports completion.
    useEffect(() => {
        if (!isOpen || !jobPost.id || jobStatus === "QUEUED" || jobStatus === "IN_PROGRESS") {
            return;
        }

        const controller = new AbortController();

        const run = async () => {
            setLoading(true);
            setError(null);

            try {
                const url = `/api/v1/job-post-assessments/${jobPost.id}/${CANDIDATE_PROFILE_ID}`;
                const response = await fetch(url, { signal: controller.signal });

                if (response.status === 404) {
                    if (!controller.signal.aborted) {
                        setAssessment(null);
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch assessment: ${response.status}`);
                }

                const data: IJobAssessment = await response.json();
                if (!controller.signal.aborted) {
                    setAssessment(data);
                    setReviewStatus(data.reviewStatus);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Failed to load assessment data");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        run();

        return () => {
            controller.abort();
        };
    }, [isOpen, jobPost.id, jobStatus]);

    if (!isOpen) return null;

    const jobPostData = jobPost;

    const formatLocationsAsList = (locations: unknown[] | undefined): React.ReactNode => {
        if (!locations || locations.length === 0) return "N/A";
        return (
            <ul className="locations-list">
                {locations.map((loc, index) => (
                    <li key={index}>{formatLocation(loc)}</li>
                ))}
            </ul>
        );
    };

    const handleReviewStatusSelect = (newStatus: JobAssessmentReviewStatus) => {
        setReviewStatus(newStatus);
    };

    const handleSaveReviewStatus = async () => {
        if (!assessment || !reviewStatus || savingReviewStatus) return;

        setSavingReviewStatus(true);
        try {
            const response = await fetch(
                `/api/v1/job-post-assessments/${jobPost.id}/${CANDIDATE_PROFILE_ID}/review-status`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reviewStatus }),
                }
            );
            if (!response.ok) {
                throw new Error(`Failed to update review status: ${response.status}`);
            }
            // Update the assessment with the new review status
            setAssessment({ ...assessment, reviewStatus });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save review status");
        } finally {
            setSavingReviewStatus(false);
        }
    };

    return (
        <div className="job-post-modal-overlay" onClick={onClose}>
            <div className="job-post-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Job Post Details</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    <div className="job-info-header">
                        <div className="job-info-row">
                            <span className="job-info-label">Job Title:</span>
                            <span className="job-info-value">{jobPostData.title}</span>
                        </div>
                        <div className="job-info-row">
                            <span className="job-info-label">Requisition ID:</span>
                            <span className="job-info-value">{jobPostData.requisitionId}</span>
                        </div>
                        <div className="job-info-row">
                            <span className="job-info-label">Apply Here:</span>
                            <span className="job-info-value" title={jobPostData.jobLink || "N/A"}>
                                <a href={jobPostData.jobLink || "#"} target="_blank" rel="noopener noreferrer">
                                    {jobPostData.jobLink || "N/A"}
                                </a>
                            </span>
                        </div>
                    </div>
                    <br />
                    <div className="detail-tabs">
                        <button
                            type="button"
                            className={`detail-tab ${activeTab === "details" ? "active" : ""}`}
                            onClick={() => setActiveTab("details")}
                        >
                            Job Details
                        </button>
                        <button
                            type="button"
                            className={`detail-tab ${activeTab === "application" ? "active" : ""}`}
                            onClick={() => setActiveTab("application")}
                        >
                            Application Status
                        </button>
                        <button
                            type="button"
                            className={`detail-tab ${activeTab === "assessment" ? "active" : ""}`}
                            onClick={() => setActiveTab("assessment")}
                        >
                            Job Assessment
                        </button>
                    </div>

                    {activeTab === "details" &&
                        (jobPostData.detail ? (
                            <div className="job-post-detail">
                                <div className="detail-card">
                                    <div className="detail-section">
                                        <h4>Description</h4>
                                        <div
                                            className="detail-description"
                                            dangerouslySetInnerHTML={{
                                                __html: jobPostData.detail.description
                                                    ? DOMPurify.sanitize(jobPostData.detail.description)
                                                    : "No description available",
                                            }}
                                        />
                                    </div>

                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Remote Type</span>
                                            <span className="detail-value">
                                                {jobPostData.detail.remoteType || "N/A"}
                                            </span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Applicant Locations:</span>
                                            <span className="detail-value">
                                                {formatList(jobPostData.detail.applicantLocations)}
                                            </span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Employment Type:</span>
                                            <span className="detail-value">
                                                {jobPostData.detail.employmentType || "N/A"}
                                            </span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Valid Through:</span>
                                            <span className="detail-value">
                                                {jobPostData.detail.validThrough || "N/A"}
                                            </span>
                                        </div>

                                        <div className="detail-item detail-item-full-width">
                                            <span className="detail-label">Locations:</span>
                                            <span className="detail-value">
                                                {formatLocationsAsList(
                                                    jobPostData.detail.locations || jobPost.locations
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-detail">
                                <p>No detail information available for this job post.</p>
                                <p>Detail Path: {jobPost.detailPath}</p>
                            </div>
                        ))}

                    {activeTab === "application" && (
                        <div className="detail-card">
                            <ApplicationStatusPanel jobPostId={jobPost.id} onStatusSaved={() => {}} />
                        </div>
                    )}

                    {activeTab === "assessment" && (
                        <div className="assessment-column">
                            {jobStatus === "FAILED" ? (
                                <div className="error-container">
                                    <p className="error-message">
                                        The job assessment failed to complete. Please try again.
                                    </p>
                                    <button onClick={onRunAssessment} className="retry-button">
                                        Retry
                                    </button>
                                </div>
                            ) : jobStatus === "QUEUED" || jobStatus === "IN_PROGRESS" ? (
                                <div className="queued-container">
                                    <div className="spinner"></div>
                                    <h3>
                                        {jobStatus === "IN_PROGRESS" ? "Assessment In Progress" : "Assessment Accepted"}
                                    </h3>
                                    <p>
                                        The job assessment request was accepted and has been queued for processing.
                                        Results will appear here automatically once the assessment completes.
                                    </p>
                                    <p className="queued-subtitle">
                                        This may take a minute or two. You can close this window; a notification will
                                        appear once the assessment is ready.
                                    </p>
                                </div>
                            ) : loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Loading assessment data...</p>
                                </div>
                            ) : error ? (
                                <div className="error-container">
                                    <p className="error-message">{error}</p>
                                    <button onClick={() => window.location.reload()} className="retry-button">
                                        Retry
                                    </button>
                                </div>
                            ) : assessment ? (
                                <div className="assessment-container">
                                    <div className="assessment-actions">
                                        <button onClick={onRunAssessment} className="rerun-button">
                                            Re-run Assessment
                                        </button>
                                    </div>
                                    <div className="assessment-panel">
                                        {/* Overall Score Section */}
                                        {assessment.jobMatchScore && (
                                            <div className="assessment-subsection">
                                                <h3>Overall Job Match Score</h3>
                                                <div className="score-display">
                                                    <div
                                                        className="match-score-circle"
                                                        style={{
                                                            backgroundColor: getMatchTypeColor(
                                                                getScoreCategory(assessment.jobMatchScore.score)
                                                            ),
                                                        }}
                                                    >
                                                        <span className="score-value">
                                                            {Math.round(assessment.jobMatchScore.score)}%
                                                        </span>
                                                    </div>
                                                    <div className="score-breakdown">
                                                        <div className="score-stat">
                                                            <span className="stat-label">Total Requirements:</span>
                                                            <span className="stat-value">
                                                                {assessment.jobMatchScore.totalRequirements}
                                                            </span>
                                                        </div>
                                                        <div className="score-stat">
                                                            <span className="stat-label">Direct Matches:</span>
                                                            <span
                                                                className="stat-value"
                                                                style={{ color: getMatchTypeColor("direct") }}
                                                            >
                                                                {assessment.jobMatchScore.directMatches}
                                                            </span>
                                                        </div>
                                                        <div className="score-stat">
                                                            <span className="stat-label">Transferable Matches:</span>
                                                            <span
                                                                className="stat-value"
                                                                style={{ color: getMatchTypeColor("transferable") }}
                                                            >
                                                                {assessment.jobMatchScore.transferableMatches}
                                                            </span>
                                                        </div>
                                                        <div className="score-stat">
                                                            <span className="stat-label">Missing Matches:</span>
                                                            <span
                                                                className="stat-value"
                                                                style={{ color: getMatchTypeColor("missing") }}
                                                            >
                                                                {assessment.jobMatchScore.missingMatches}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Section */}
                                        <div className="assessment-subsection">
                                            <h3>Assessment Status</h3>
                                            <div className="status-display">
                                                <div className="status-row">
                                                    <span className="status-label">Status:</span>
                                                    <span
                                                        className="status-badge"
                                                        style={{
                                                            backgroundColor: getAssessmentStatusColor(
                                                                assessment.status
                                                            ),
                                                        }}
                                                    >
                                                        {assessment.status}
                                                    </span>
                                                </div>
                                                <div className="status-row">
                                                    <span className="status-label">Review Status:</span>
                                                    <div className="review-status-selector">
                                                        {(
                                                            [
                                                                "unreviewed",
                                                                "accepted",
                                                                "flagged",
                                                            ] as JobAssessmentReviewStatus[]
                                                        ).map(status => {
                                                            const isSelected = reviewStatus === status;
                                                            return (
                                                                <span
                                                                    key={status}
                                                                    className={`review-status-option ${isSelected ? "selected" : ""}`}
                                                                    style={{
                                                                        opacity: isSelected ? 1 : 0.5,
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleReviewStatusSelect(status)}
                                                                >
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                    {reviewStatus && assessment?.reviewStatus !== reviewStatus && (
                                                        <button
                                                            className="save-review-status-button"
                                                            onClick={handleSaveReviewStatus}
                                                            disabled={savingReviewStatus}
                                                        >
                                                            {savingReviewStatus ? "Saving..." : "Save"}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="status-row">
                                                    <span className="status-label">Created At:</span>
                                                    <span className="status-value">
                                                        {formatDate(assessment.createdAt, "datetime")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pre-Screening Result Section */}
                                        {assessment.screenResult && (
                                            <div className="assessment-subsection">
                                                <h3>Pre-Screening Result</h3>
                                                <div className="screen-display">
                                                    <div className="screen-row">
                                                        <span className="screen-label">Disposition:</span>
                                                        <span
                                                            className="screen-badge"
                                                            style={{
                                                                backgroundColor: getScreenDispositionColor(
                                                                    assessment.screenResult.disposition
                                                                ),
                                                            }}
                                                        >
                                                            {assessment.screenResult.disposition}
                                                        </span>
                                                    </div>
                                                    <div className="screen-row">
                                                        <span className="screen-label">Reason:</span>
                                                        <span className="screen-value">
                                                            {assessment.screenResult.reason}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Requirement Matches Summary */}
                                        <div className="assessment-subsection">
                                            <h3>Requirement Matches Summary</h3>
                                            {assessment.requirementMatches.length > 0 ? (
                                                <>
                                                    <div className="matches-list">
                                                        {assessment.requirementMatches
                                                            .slice()
                                                            .sort((a, b) => {
                                                                const order: Record<string, number> = {
                                                                    direct: 0,
                                                                    transferable: 1,
                                                                    missing: 2,
                                                                };
                                                                return (
                                                                    (order[a.matchType] ?? 3) -
                                                                    (order[b.matchType] ?? 3)
                                                                );
                                                            })
                                                            .map((match, index) => {
                                                                const symbol =
                                                                    match.matchType === "direct"
                                                                        ? "\u2713"
                                                                        : match.matchType === "transferable"
                                                                          ? "~"
                                                                          : "\u2717";
                                                                const color = getMatchTypeColor(match.matchType);

                                                                return (
                                                                    <ul key={index} className="match-list">
                                                                        <li className="match-list-item">
                                                                            <span
                                                                                className="match-symbol"
                                                                                style={{ color }}
                                                                            >
                                                                                {symbol}
                                                                            </span>
                                                                            <div className="match-content">
                                                                                <span className="match-list-area">
                                                                                    {match.requirement.area}
                                                                                </span>
                                                                                <div className="match-detail-panel">
                                                                                    <p className="match-detail-row">
                                                                                        <span className="match-detail-label">
                                                                                            Description:
                                                                                        </span>{" "}
                                                                                        {match.requirement.description}
                                                                                    </p>
                                                                                    {match.evidence && (
                                                                                        <p className="match-detail-row">
                                                                                            <span className="match-detail-label">
                                                                                                Evidence:
                                                                                            </span>{" "}
                                                                                            {match.evidence}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </li>
                                                                    </ul>
                                                                );
                                                            })}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="no-requirements">No requirement matches found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-assessment">
                                    <p>No assessment has been run yet for this job post.</p>
                                    <button onClick={onRunAssessment} className="retry-button">
                                        Run Assessment
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="button-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function getScoreCategory(score: number): string {
    if (score >= 75) return "direct";
    if (score >= 50) return "transferable";
    return "missing";
}

export default JobPostModal;
