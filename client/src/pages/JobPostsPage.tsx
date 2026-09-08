import React, { useState } from 'react';
import { useJobPosts } from '../hooks/useJobPosts';
import { useJobSources } from '../hooks/useJobSources';
import { useSyncJobPosts } from '../hooks/useSyncJobPosts';
import { IJobPost } from '../types/JobPost';
import JobPostModal from '../components/JobPostModal';
import SyncModal from '../components/SyncModal';
import './JobPostsPage.css';

function JobPostsPage() {
    const { jobPosts, loading: jobPostsLoading, error: jobPostsError } = useJobPosts();
    const { jobSources, getCompanyName, loading: sourcesLoading, error: sourcesError } = useJobSources();
    const { sync, loading: syncLoading, error: syncError, success: syncSuccess, reset: resetSync } = useSyncJobPosts();
    const [selectedJobPost, setSelectedJobPost] = useState<IJobPost | null>(null);
    const [isJobPostModalOpen, setIsJobPostModalOpen] = useState<boolean>(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

    // Check if either is loading
    const loading = jobPostsLoading || sourcesLoading;

    const handleSync = async (sourceId?: string) => {
        await sync(sourceId);
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
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatLocations = (locations: unknown[] | undefined) => {
        if (!locations || locations.length === 0) return 'N/A';
        
        // Try to extract location info
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
                <h2>Job Posts ({jobPosts.length})</h2>
                <button 
                    onClick={openSyncModal}
                    className="update-button"
                    disabled={jobSources.length === 0}
                >
                    Update
                </button>
            </div>
            
            {jobPosts.length === 0 ? (
                <p className="no-data">No job posts found.</p>
            ) : (
                <div className="table-container">
                    <table className="job-posts-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Requisition ID</th>
                                <th>Title</th>
                                <th>Detail Path</th>
                                <th>Locations</th>
                                <th>Posted Date</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobPosts.map((jobPost) => (
                                <tr
                                    key={jobPost.id}
                                    onClick={() => handleRowClick(jobPost)}
                                    className="job-post-row"
                                    title="Click to view details"
                                >
                                    <td>{getCompanyName(jobPost.sourceId)}</td>
                                    <td>{jobPost.requisitionId || 'N/A'}</td>
                                    <td>{jobPost.title}</td>
                                    <td className="detail-path">{jobPost.detailPath}</td>
                                    <td>{formatLocations(jobPost.locations)}</td>
                                    <td>{formatDate(jobPost.postedDate)}</td>
                                    <td>{formatDate(jobPost.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                syncLoading={syncLoading}
                syncError={syncError}
                syncSuccess={syncSuccess}
            />
        </div>
    );
}

export default JobPostsPage;
