import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { IJobPostData } from "../types/JobPost";
import { IJobAssessment, JobAssessmentStatus, JobAssessmentReviewStatus } from "../types/JobAssessment";
import { JobQueueStatus } from "../types/JobAssessmentJob";
import "./JobPostModal.css";

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
                const url = `/api/v1/job-posts/${jobPost.id}/assessments/${CANDIDATE_PROFILE_ID}`;
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

    const getStatusColor = (status: JobAssessmentStatus) => {
        switch (status) {
            case "complete":
                return "#22c55e"; // green-500
            case "incomplete":
                return "#facc15"; // yellow-400
            default:
                return "#9ca3af"; // gray-400
        }
    };

    const getReviewStatusColor = (status: JobAssessmentReviewStatus) => {
        switch (status) {
            case "accepted":
                return "#22c55e"; // green-500
            case "flagged":
                return "#ef4444"; // red-500
            case "unreviewed":
                return "#9ca3af"; // gray-400
            default:
                return "#9ca3af";
        }
    };

    const getMatchTypeColor = (matchType: string) => {
        switch (matchType) {
            case "direct":
                return "#22c55e"; // green
            case "transferable":
                return "#facc15"; // yellow/orange
            case "missing":
                return "#ef4444"; // red
            default:
                return "#9ca3af"; // gray
        }
    };

    const getScreenDispositionColor = (disposition: string) => {
        switch (disposition) {
            case "advance":
                return "#22c55e";
            case "reject":
                return "#ef4444";
            case "review":
                return "#facc15";
            default:
                return "#9ca3af";
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    const formatLocationsAsList = (locations: unknown[] | undefined): React.ReactNode => {
        if (!locations || locations.length === 0) return "N/A";

        const locationItems = locations.map((loc, index) => {
            let locationStr: string;
            if (typeof loc === "string") {
                locationStr = loc;
            } else if (typeof loc === "object" && loc !== null) {
                const obj = loc as Record<string, unknown>;
                const parts = [obj.city as string, obj.state as string, obj.country as string].filter(Boolean);
                locationStr = parts.length > 0 ? parts.join(", ") : "Unknown";
            } else {
                locationStr = String(loc);
            }
            return <li key={index}>{locationStr}</li>;
        });

        return <ul className="locations-list">{locationItems}</ul>;
    };

    const formatApplicantLocations = (applicantLocations: string[] | undefined) => {
        if (!applicantLocations || applicantLocations.length === 0) return "N/A";
        return applicantLocations.join(", ");
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
                    <div className="modal-columns">
                        <div className="detail-column">
                            {jobPostData.detail ? (
                                <div className="job-post-detail">
                                    <div className="detail-card">
                                        <h3 className="detail-title">{jobPost.title}</h3>

                                        <div className="job-post-link-section">
                                            <h4>View Job:&nbsp;</h4>

                                            <a href={jobPost.jobLink || "#"} target="_blank" rel="noopener noreferrer">
                                                {jobPost.jobLink || "N/A"}
                                            </a>
                                        </div>
                                        <br></br>

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
                                                    {formatApplicantLocations(jobPostData.detail.applicantLocations)}
                                                </span>
                                            </div>

                                            <div className="detail-item">
                                                <span className="detail-label">Employment Type:</span>
                                                <span className="detail-value">
                                                    {jobPostData.detail.employmentType || "N/A"}
                                                </span>
                                            </div>

                                            <div className="detail-item">
                                                <span className="detail-label">Days Old:</span>
                                                <span className="detail-value">
                                                    {jobPostData.detail.daysOld || "N/A"}
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
                            )}
                        </div>

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
                                                        style={{ backgroundColor: getStatusColor(assessment.status) }}
                                                    >
                                                        {assessment.status}
                                                    </span>
                                                </div>
                                                <div className="status-row">
                                                    <span className="status-label">Review Status:</span>
                                                    <span
                                                        className="status-badge"
                                                        style={{
                                                            backgroundColor: getReviewStatusColor(
                                                                assessment.reviewStatus
                                                            ),
                                                        }}
                                                    >
                                                        {assessment.reviewStatus}
                                                    </span>
                                                </div>
                                                <div className="status-row">
                                                    <span className="status-label">Created At:</span>
                                                    <span className="status-value">
                                                        {formatDate(assessment.createdAt)}
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
                    </div>
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

function getScoreCategory(score: number): string {
    if (score >= 75) return "direct";
    if (score >= 50) return "transferable";
    return "missing";
}

export default JobPostModal;
