/**
 * Defines the contract for interacting with candidate profile data.
 * Implementations of this interface will handle persistence and retrieval
 * of candidate profiles as aggregates, ensuring consistency and enforcing
 * business rules.
 */

import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";

export interface IJobCandidateProfileRepository {
    // =============================================
    // Candidate Profile Aggregate CRUD Operations
    // =============================================
    /**
     * Creates a new candidate profile in the repository.
     * @param profile The candidate profile to create.
     * @returns The created candidate profile with its generated ID.
     */
    createCandidateProfile(profile: ICandidateProfile): Promise<ICandidateProfile>;

    /**
     * Retrieves a candidate profile by its ID.
     * @param id The ID of the candidate profile to retrieve.
     * @returns The candidate profile if found, or `null` if not found.
     */
    getCandidateProfileById(id: string): Promise<ICandidateProfile | null>;

    /**
     * Retrieves a candidate profile by its ID or throws an error
     * @param id The ID of the candidate profile to retrieve.
     * @returns The candidate profile if found, or `null` if not found.
     * @throws An error if candidate profile with ID does not exist.
     */
    getCandidateProfileByIdOrThrow(id: string): Promise<ICandidateProfile>;

    /**
     * Retrieves all candidate profiles.
     * @returns An array of all candidate profiles.
     */
    getCandidateProfiles(): Promise<ICandidateProfile[]>;

    /**
     * Updates an existing candidate profile.
     * @param profile The candidate profile to update.
     * @returns The updated candidate profile.
     */
    updateCandidateProfile(profile: ICandidateProfile): Promise<ICandidateProfile>;

    /**
     * Deletes a candidate profile by its ID.
     * @param id The ID of the candidate profile to delete.
     */
    deleteCandidateProfile(id: string): Promise<void>;
}
