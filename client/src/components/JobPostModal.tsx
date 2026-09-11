import React from "react";
import DOMPurify from "dompurify";
import { IJobPostData } from "../types/JobPost";
import "./JobPostModal.css";

interface JobPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPost: IJobPostData;
}

function JobPostModal({ isOpen, onClose, jobPost }: JobPostModalProps) {
    if (!isOpen) return null;

    const detail = jobPost.detail;

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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Job Post Details</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {detail ? (
                        <div className="job-post-detail">
                            <div className="detail-card">
                                <h3 className="detail-title">{detail.title || jobPost.title}</h3>

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
                                            __html: detail.description
                                                ? DOMPurify.sanitize(detail.description)
                                                : "No description available",
                                        }}
                                    />
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Remote Type:</span>
                                        <span className="detail-value">{detail.remoteType || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Applicant Locations:</span>
                                        <span className="detail-value">
                                            {formatApplicantLocations(detail.applicantLocations)}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Employment Type:</span>
                                        <span className="detail-value">{detail.employmentType || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Days Old:</span>
                                        <span className="detail-value">{detail.daysOld || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Valid Through:</span>
                                        <span className="detail-value">{detail.validThrough || "N/A"}</span>
                                    </div>

                                    <div className="detail-item detail-item-full-width">
                                        <span className="detail-label">Locations:</span>
                                        <span className="detail-value">
                                            {formatLocationsAsList(detail.locations || jobPost.locations)}
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

                <div className="modal-footer">
                    <button className="close-button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default JobPostModal;
