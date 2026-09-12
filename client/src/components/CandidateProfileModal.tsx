import { ICandidateProfile } from "../types/CandidateProfile";
import "./CandidateProfileModal.css";

interface CandidateProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: ICandidateProfile | null;
}

function CandidateProfileModal({ isOpen, onClose, profile }: CandidateProfileModalProps) {
    if (!isOpen || !profile) return null;

    const formatList = (values: string[] | undefined): string => {
        if (!values || values.length === 0) return "N/A";
        return values.join(", ");
    };

    return (
        <div className="candidate-profile-modal-overlay" onClick={onClose}>
            <div className="candidate-profile-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Candidate Profile Details</h2>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-card">
                        <h3 className="detail-title">{profile.currentTitle || "Untitled Candidate"}</h3>

                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Total Years Experience:</span>
                                <span className="detail-value">{profile.totalYearsExperience}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Citizenship Country:</span>
                                <span className="detail-value">
                                    {profile.workAuthorization?.citizenshipCountry || "N/A"}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Authorized to Work in US:</span>
                                <span className="detail-value">
                                    {profile.workAuthorization?.authorizedToWorkInUS ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Requires Sponsorship:</span>
                                <span className="detail-value">
                                    {profile.workAuthorization?.requiresSponsorship ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Strengths</h4>
                            <p className="detail-text">{formatList(profile.strengths)}</p>
                        </div>

                        <div className="detail-section">
                            <h4>Desired Work</h4>
                            <p className="detail-text">{formatList(profile.desiredWork)}</p>
                        </div>

                        <div className="detail-section">
                            <h4>Desired Growth Areas</h4>
                            <p className="detail-text">{formatList(profile.desiredGrowthAreas)}</p>
                        </div>

                        <div className="detail-section">
                            <h4>Avoid Work</h4>
                            <p className="detail-text">{formatList(profile.avoidWork)}</p>
                        </div>

                        <div className="detail-section">
                            <h4>Skills ({profile.skills?.length ?? 0})</h4>
                            {profile.skills && profile.skills.length > 0 ? (
                                <table className="skills-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Level</th>
                                            <th>Years</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.skills.map((skill, index) => (
                                            <tr key={index}>
                                                <td>{skill.name}</td>
                                                <td>{skill.category}</td>
                                                <td>{skill.level}</td>
                                                <td>{skill.years ?? "N/A"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="detail-text">No skills listed.</p>
                            )}
                        </div>

                        <div className="detail-section">
                            <h4>Experience ({profile.experience?.length ?? 0})</h4>
                            {profile.experience && profile.experience.length > 0 ? (
                                <ul className="experience-list">
                                    {profile.experience.map((exp, index) => (
                                        <li key={index} className="experience-item">
                                            <div className="experience-title">
                                                {exp.title} @ {exp.company}
                                            </div>
                                            <div className="experience-dates">
                                                {exp.startDate || "N/A"} &ndash;{" "}
                                                {exp.current ? "Present" : exp.endDate || "N/A"}
                                            </div>
                                            {exp.highlights?.length > 0 && (
                                                <ul className="highlights-list">
                                                    {exp.highlights.map((highlight, hIndex) => (
                                                        <li key={hIndex}>{highlight}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="detail-text">No experience listed.</p>
                            )}
                        </div>

                        <div className="detail-section">
                            <h4>Preferences</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Work Arrangements:</span>
                                    <span className="detail-value">
                                        {formatList(profile.preferences?.workArrangements)}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Employment Types:</span>
                                    <span className="detail-value">
                                        {formatList(profile.preferences?.employmentTypes)}
                                    </span>
                                </div>
                                <div className="detail-item detail-item-full-width">
                                    <span className="detail-label">Locations:</span>
                                    <span className="detail-value">
                                        {profile.preferences?.locations?.length
                                            ? profile.preferences.locations
                                                  .map(
                                                      loc =>
                                                          `${[loc.city, loc.state, loc.country]
                                                              .filter(Boolean)
                                                              .join(", ")}`
                                                  )
                                                  .join("; ")
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
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

export default CandidateProfileModal;
