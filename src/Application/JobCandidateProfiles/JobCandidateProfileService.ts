/**
 * Implementation of the IJobCandidateProfileService interface.
 * This service handles business logic for candidate profiles and coordinates
 * with the repository for data persistence.
 */

import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { IJobCandidateProfileService } from "./IJobCandidateProfileService";
import { IJobCandidateProfileRepository } from "../../Infrastructure/Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { readFileSync } from "fs";

export class JobCandidateProfileService implements IJobCandidateProfileService {
    constructor(
        private readonly repository: IJobCandidateProfileRepository,
        private readonly logger: ILogger
    ) {}

    /**
     * Creates a new candidate profile.
     * @param profileData The candidate profile data to create.
     * @returns The created candidate profile.
     */
    async createCandidateProfile(profileData: ICandidateProfile): Promise<ICandidateProfile> {
        this.logger.debug(`Creating new candidate profile for ${profileData.currentTitle || "unnamed candidate"}`);

        // Validate required fields
        if (!profileData.totalYearsExperience) {
            this.logger.warn("Attempted to create a candidate profile without total years of experience");
            throw new Error("Total years of experience is required");
        }

        if (!profileData.strengths || profileData.strengths.length === 0) {
            this.logger.warn("Attempted to create a candidate profile without strengths");
            throw new Error("At least one strength is required");
        }

        if (!profileData.desiredWork || profileData.desiredWork.length === 0) {
            this.logger.warn("Attempted to create a candidate profile without desired work");
            throw new Error("At least one desired work item is required");
        }

        if (!profileData.desiredGrowthAreas || profileData.desiredGrowthAreas.length === 0) {
            this.logger.warn("Attempted to create a candidate profile without desired growth areas");
            throw new Error("At least one desired growth area is required");
        }

        if (!profileData.avoidWork || profileData.avoidWork.length === 0) {
            this.logger.warn("Attempted to create a candidate profile without avoid work items");
            throw new Error("At least one avoid work item is required");
        }

        // Create the profile
        const createdProfile = await this.repository.createCandidateProfile(profileData);
        this.logger.info(`Successfully created candidate profile with ID: ${createdProfile.id}`);

        return createdProfile;
    }

    /**
     * Retrieves a candidate profile by its ID.
     * @param id The ID of the candidate profile to retrieve.
     * @returns The candidate profile if found.
     * @throws Error if the profile is not found.
     */
    async getCandidateProfileById(id: string): Promise<ICandidateProfile> {
        this.logger.debug(`Retrieving candidate profile with ID: ${id}`);
        const profile = await this.repository.getCandidateProfileById(id);

        if (!profile) {
            this.logger.warn(`No candidate profile found with ID: ${id}`);
            throw new Error(`Candidate profile with ID ${id} not found`);
        }

        this.logger.debug(`Successfully retrieved candidate profile with ID: ${id}`);
        return profile;
    }

    /**
     * Retrieves all candidate profiles.
     * @returns An array of all candidate profiles.
     */
    async getCandidateProfiles(): Promise<ICandidateProfile[]> {
        this.logger.debug("Retrieving all candidate profiles");

        try {
            const profiles = await this.repository.getCandidateProfiles();
            this.logger.debug(`Successfully retrieved ${profiles.length} candidate profiles`);
            return profiles;
        } catch (error) {
            this.logger.error(`Error retrieving candidate profiles: ${error}`);
            throw new Error("Failed to retrieve candidate profiles");
        }
    }

    public async seedCandidateProfilesWithDefault(): Promise<void> {
        const profilePath = process.env.CANDIDATE_PROFILE;
        if (!profilePath) {
            throw new Error("CANDIDATE_PROFILE environment variable is not set.");
        }
        const json = readFileSync(profilePath, "utf-8");
        const defaultProfile = JSON.parse(json) as ICandidateProfile;
        await this.repository.createCandidateProfile(defaultProfile);
    }
}
