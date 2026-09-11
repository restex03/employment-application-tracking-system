import { IJobAssessment, JobAssessmentStatus, JobAssessmentReviewStatus } from "../types/JobAssessment";
import { useAbortableFetch } from "../hooks/useAbortableFetch";
import "./JobMatchDetailsModal.css";

interface JobMatchDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPostId: string;
}

const CANDIDATE_PROFILE_ID = "russell-estes";

async function fetchAssessment(jobPostId: string, signal: AbortSignal): Promise<IJobAssessment> {
    const getUrl = `/api/v1/job-posts/${jobPostId}/assessments/${CANDIDATE_PROFILE_ID}`;
    const getResponse = await fetch(getUrl, { signal });

    if (getResponse.ok) {
        return await getResponse.json();
    }

    if (getResponse.status !== 404) {
        throw new Error(`Failed to fetch assessment: ${getResponse.status}`);
    }

    const postResponse = await fetch(getUrl, {
        method: "POST",
        signal,
    });

    if (!postResponse.ok) {
        throw new Error(`Failed to run job assessment: ${postResponse.status}`);
    }

    return fetchAssessmentWithRetry(getUrl, 5, 1000, signal);
}

async function fetchAssessmentWithRetry(
    url: string,
    maxRetries: number,
    delayMs: number,
    signal: AbortSignal
): Promise<IJobAssessment> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const response = await fetch(url, { signal });
        if (response.ok) {
            return await response.json();
        }

        if (attempt < maxRetries - 1) {
            await waitForRetry(delayMs, signal);
        }
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(`Failed to fetch assessment after retries: ${response.status}`);
    }

    return await response.json();
}

function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            signal.removeEventListener("abort", abortHandler);
            resolve();
        }, delayMs);
        const abortHandler = () => {
            clearTimeout(timeoutId);
            reject(new DOMException("The request was aborted", "AbortError"));
        };

        if (signal.aborted) {
            abortHandler();
            return;
        }

        signal.addEventListener("abort", abortHandler, { once: true });
    });
}

function JobMatchDetailsModal({ isOpen, onClose, jobPostId }: JobMatchDetailsModalProps) {
    const {
        data: assessment,
        loading,
        error,
    } = useAbortableFetch(signal => fetchAssessment(jobPostId, signal), [jobPostId], isOpen && Boolean(jobPostId));

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

                            {/* Pre-Screening Result Section */}
                            {assessment.screenResult && (
                                <div className="screen-section">
                                    <h3>Pre-Screening Result</h3>
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

                            {/* Requirement Matches Summary */}
                            <div className="matches-section">
                                <h3>Requirement Matches Summary</h3>
                                {assessment.requirementMatches.length > 0 ? (
                                    <>
                                        <div className="match-legend">
                                            {(["direct", "transferable", "missing"] as const).map(matchType => {
                                                const symbol =
                                                    matchType === "direct"
                                                        ? "\u2713"
                                                        : matchType === "transferable"
                                                        ? "~"
                                                        : "\u2717";
                                                const color = getMatchTypeColor(matchType);
                                                const label =
                                                    matchType === "direct"
                                                        ? "Direct"
                                                        : matchType === "transferable"
                                                        ? "Transferable"
                                                        : "Missing";
                                                return (
                                                    <span key={matchType} className="match-legend-item">
                                                        {label}:
                                                        <span
                                                            className="match-symbol"
                                                            style={{ color }}
                                                        >
                                                            {symbol}
                                                        </span>
                                                    </span>
                                                );
                                            })}
                                        </div>
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
                                                                <span
                                                                    className="match-list-area"
                                                                    title={
                                                                        match.evidence
                                                                            ? `Evidence: ${match.evidence}`
                                                                            : undefined
                                                                    }
                                                                >
                                                                    {match.requirement.area}
                                                                    <ul className="match-sublist">
                                                                        <li className="match-sublist-item">
                                                                            {match.requirement.description}
                                                                        </li>
                                                                    </ul>
                                                                </span>
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
