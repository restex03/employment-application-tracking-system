import { useState } from "react";
import { useCandidateProfiles } from "../hooks/useCandidateProfiles";
import { ICandidateProfile } from "../types/CandidateProfile";

import "./CandidateProfilesPage.css";
import CandidateProfileModal from "../components/CandidateProfileModal";

function CandidateProfilesPage() {
    const { candidateProfiles, loading, error } = useCandidateProfiles();

    const [selectedProfile, setSelectedProfile] = useState<ICandidateProfile | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

    const openViewModal = (profile: ICandidateProfile) => {
        setSelectedProfile(profile);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedProfile(null);
    };

    const formatList = (values: string[], maxItems = 3): string => {
        if (!values || values.length === 0) return "N/A";
        const shown = values.slice(0, maxItems).join(", ");
        return values.length > maxItems ? `${shown}, +${values.length - maxItems} more` : shown;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading candidate profiles...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">Error: {error}</p>
                <button onClick={() => window.location.reload()} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="candidate-profiles-page">
            <div className="page-header">
                <h2>Candidate Profiles ({candidateProfiles.length})</h2>
            </div>

            <div className="table-container">
                <table className="candidate-profiles-table">
                    <thead>
                        <tr>
                            <th className="row-count">#</th>
                            <th>Current Title</th>
                            <th>Years Experience</th>
                            <th>Work Authorization</th>
                            <th>Strengths</th>
                            <th>Desired Work</th>
                            <th>Skills</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidateProfiles.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="no-data">
                                    No candidate profiles yet.
                                </td>
                            </tr>
                        ) : (
                            candidateProfiles.map((profile, index) => (
                                <tr
                                    key={profile.id}
                                    className="candidate-profile-row"
                                    onClick={() => openViewModal(profile)}
                                >
                                    <td className="row-count">{index + 1}</td>
                                    <td>{profile.currentTitle || "N/A"}</td>
                                    <td>{profile.totalYearsExperience}</td>
                                    <td>
                                        {profile.workAuthorization?.citizenshipCountry || "N/A"}
                                        {profile.workAuthorization?.requiresSponsorship ? " (Sponsorship Req.)" : ""}
                                    </td>
                                    <td>{formatList(profile.strengths)}</td>
                                    <td>{formatList(profile.desiredWork)}</td>
                                    <td>{profile.skills?.length ?? 0}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="details-button"
                                            title="View candidate profile"
                                            aria-label="View candidate profile"
                                            onClick={e => {
                                                e.stopPropagation();
                                                openViewModal(profile);
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
            </div>

            <CandidateProfileModal isOpen={isViewModalOpen} onClose={closeViewModal} profile={selectedProfile} />
        </div>
    );
}

export default CandidateProfilesPage;
