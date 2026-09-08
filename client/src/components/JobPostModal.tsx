import React from 'react';
import { IJobPost, IJobPostDetail } from '../types/JobPost';
import './JobPostModal.css';

interface JobPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobPost: IJobPost;
}

function JobPostModal({ isOpen, onClose, jobPost }: JobPostModalProps) {
    if (!isOpen) return null;

    const detail = jobPost.detail;

    const formatLocations = (locations: unknown[] | undefined) => {
        if (!locations || locations.length === 0) return 'N/A';
        
        const locationStrings = locations.map(loc => {
            if (typeof loc === 'string') return loc;
            if (typeof loc === 'object' && loc !== null) {
                const obj = loc as Record<string, unknown>;
                const parts = [
                    obj.city as string,
                    obj.state as string,
                    obj.country as string
                ].filter(Boolean);
                return parts.length > 0 ? parts.join(', ') : 'Unknown';
            }
            return String(loc);
        });
        
        return locationStrings.join('; ');
    };

    const formatApplicantLocations = (applicantLocations: string[] | undefined) => {
        if (!applicantLocations || applicantLocations.length === 0) return 'N/A';
        return applicantLocations.join(', ');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                                
                                <div className="detail-section">
                                    <h4>Description</h4>
                                    <p className="detail-description">
                                        {detail.description || 'No description available'}
                                    </p>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Remote Type:</span>
                                        <span className="detail-value">
                                            {detail.remoteType || 'Not specified'}
                                        </span>
                                    </div>
                                    
                                    <div className="detail-item">
                                        <span className="detail-label">Applicant Locations:</span>
                                        <span className="detail-value">
                                            {formatApplicantLocations(detail.applicantLocations)}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Employment Type:</span>
                                        <span className="detail-value">
                                            {detail.employmentType || 'Not specified'}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Date Posted:</span>
                                        <span className="detail-value">
                                            {detail.datePosted || 'Not specified'}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Valid Through:</span>
                                        <span className="detail-value">
                                            {detail.validThrough || 'Not specified'}
                                        </span>
                                    </div>

                                    <div className="detail-item full-width">
                                        <span className="detail-label">Locations:</span>
                                        <span className="detail-value">
                                            {formatLocations(detail.locations || jobPost.locations)}
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
