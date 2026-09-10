import React, { useState, useEffect } from "react";
import { IJobAssessment, JobAssessmentStatus, JobAssessmentReviewStatus } from "../types/JobAssessment";
import "./JobMatchDetailsModal.css";

interface JobMatchDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPostId: string;
}

const CANDIDATE_PROFILE_ID = "russell-estes";

function JobMatchDetailsModal({ isOpen, onClose, jobPostId }: JobMatchDetailsModalProps) {
    const [assessment, setAssessment] = useState<IJobAssessment | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !jobPostId) {
            setAssessment(null);
            setError(null);
            return;
        }

        const fetchAssessment = async () => {
            setLoading(true);
            setError(null);

            try {
                // First, try to get existing assessment
                let assessmentData: IJobAssessment | null = null;

                // Try to fetch existing assessment
                const getUrl = `/api/v1/job-posts/${jobPostId}/assessments/${CANDIDATE_PROFILE_ID}`;
                const getResponse = await fetch(getUrl);

                if (getResponse.ok) {
                    assessmentData = await getResponse.json();
                    setAssessment(assessmentData);
                    setLoading(false);
                    return;
                }

                // If assessment doesn't exist (404), run the assessment
                if (getResponse.status === 404) {
                    const postUrl = `/api/v1/job-posts/${jobPostId}/assessments/${CANDIDATE_PROFILE_ID}`;
                    const postResponse = await fetch(postUrl, {
                        method: "POST",
                    });

                    if (!postResponse.ok) {
                        throw new Error(`Failed to run job assessment: ${postResponse.status}`);
                    }

                    // After running assessment, retry fetching with retry logic
                    assessmentData = await fetchWithRetry(getUrl, 5, 1000);
                    setAssessment(assessmentData);
                } else {
                    throw new Error(`Failed to fetch assessment: ${getResponse.status}`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load assessment data");
            } finally {
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [isOpen, jobPostId]);

    const fetchWithRetry = async (url: string, maxRetries: number, delayMs: number): Promise<IJobAssessment> => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const response = await fetch(url);
            if (response.ok) {
                const data: IJobAssessment = await response.json();
                return data;
            }
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        // If all retries fail, throw error
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch assessment after retries: ${response.status}`);
        }
        return await response.json();
    };

    if (!isOpen) return null;

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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Job Match Details</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
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
                            {/* Overall Score Section */}
                            {assessment.jobMatchScore && (
                                <div className="score-section">
                                    <h3>Overall Job Match Score</h3>
                                    <div className="score-display">
                                        <div
                                            className="score-circle"
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
                            <div className="status-section">
                                <h3>Assessment Status</h3>
                                <div className="status-display">
                                    <div className="status-item">
                                        <span className="status-label">Status:</span>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(assessment.status) }}
                                        >
                                            {assessment.status}
                                        </span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Review Status:</span>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getReviewStatusColor(assessment.reviewStatus) }}
                                        >
                                            {assessment.reviewStatus}
                                        </span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Created:</span>
                                        <span className="status-value">{formatDate(assessment.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Screening Result Section */}
                            {assessment.screenResult && (
                                <div className="screen-section">
                                    <h3>Screening Result</h3>
                                    <div className="screen-display">
                                        <div className="screen-item">
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
                                        <div className="screen-item">
                                            <span className="screen-label">Reason:</span>
                                            <span className="screen-value">{assessment.screenResult.reason}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Requirements Section */}
                            <div className="requirements-section">
                                <h3>Job Requirements</h3>
                                {assessment.requirements.length > 0 ? (
                                    <div className="requirements-grid">
                                        {assessment.requirements.map((requirement, index) => {
                                            // Find the matching requirement match for this requirement
                                            const requirementMatch = assessment.requirementMatches.find(
                                                rm =>
                                                    rm.requirement.area === requirement.area &&
                                                    rm.requirement.description === requirement.description
                                            );

                                            return (
                                                <div key={index} className="requirement-card">
                                                    <div className="requirement-header">
                                                        <span className="requirement-category">
                                                            {requirement.category}
                                                        </span>
                                                        <span
                                                            className="requirement-match-badge"
                                                            style={{
                                                                backgroundColor: requirementMatch
                                                                    ? getMatchTypeColor(requirementMatch.matchType)
                                                                    : "#9ca3af",
                                                            }}
                                                        >
                                                            {requirementMatch ? requirementMatch.matchType : "unknown"}
                                                        </span>
                                                    </div>
                                                    <div className="requirement-body">
                                                        <p className="requirement-area">
                                                            <strong>{requirement.area}</strong>
                                                        </p>
                                                        <p className="requirement-description">
                                                            {requirement.description}
                                                        </p>
                                                    </div>
                                                    {requirementMatch?.evidence && (
                                                        <div className="requirement-evidence">
                                                            <span className="evidence-label">Evidence:</span>
                                                            <p className="evidence-text">{requirementMatch.evidence}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="no-requirements">No requirements found for this job post.</p>
                                )}
                            </div>

                            {/* Requirement Matches Summary */}
                            <div className="matches-section">
                                <h3>Requirement Matches Summary</h3>
                                <div className="matches-grid">
                                    {assessment.requirementMatches.map((match, index) => (
                                        <div key={index} className="match-card">
                                            <div
                                                className="match-type"
                                                style={{ color: getMatchTypeColor(match.matchType) }}
                                            >
                                                <strong>{match.matchType}</strong>
                                            </div>
                                            <div className="match-requirement">
                                                <p>
                                                    <strong>{match.requirement.area}</strong>
                                                </p>
                                                <p>{match.requirement.description}</p>
                                            </div>
                                            {match.evidence && (
                                                <div className="match-evidence">
                                                    <p>{match.evidence}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-assessment">
                            <p>No assessment data available for this job post.</p>
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

function getScoreCategory(score: number): string {
    if (score >= 75) return "direct";
    if (score >= 50) return "transferable";
    return "missing";
}

export default JobMatchDetailsModal;
