import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

import {
    ICandidateProfile,
    ISkill,
    ICandidateExperience,
    ILocationPreference,
    ICompensationPreference,
    IWorkAuthorization,
    ICandidateEducation,
    SkillLevel,
    SkillCategory,
    WorkArrangement,
    EmploymentType,
} from "../../../../Domain/Candidates/ICandidateProfile";
import { IJobCandidateProfileRepository } from "../IJobCandidateProfileRepository";
import { ILogger } from "../../../Logging/ILogger";

interface CandidateProfileRow {
    id: string;
    current_title: string | null;
    total_years_experience: number;
    education_json: string | null;
    work_auth_citizenship_country: string | null;
    work_auth_authorized_in_us: number | null;
    work_auth_requires_sponsorship: number | null;
    strengths: string;
    desired_work: string;
    desired_growth_areas: string;
    avoid_work: string;
    career_priorities_technical_ownership: number;
    career_priorities_architecture_depth: number;
    career_priorities_skill_portability: number;
    career_priorities_learning_opportunity: number;
    career_priorities_compensation: number;
    career_priorities_stability: number;
    career_priorities_work_life_balance: number | null;
    preferences_work_arrangements: string;
    preferences_compensation_minimum_base_salary: number | null;
    preferences_compensation_target_base_salary: number | null;
    preferences_compensation_consider_variable_compensation: number | null;
    constraints_requires_remote_or_approved_hybrid_location: number | null;
    constraints_requires_sponsorship: number | null;
    constraints_hard_constraints: string | null;
}

interface CandidateSkillRow {
    id: string;
    candidate_profile_id: string;
    name: string;
    category: SkillCategory;
    level: SkillLevel;
    years: number | null;
    production_experience: number | null;
    context: string | null;
}

interface CandidateExperienceRow {
    id: string;
    candidate_profile_id: string;
    title: string;
    company: string;
    start_date: string | null;
    end_date: string | null;
    current: number | null;
    highlights: string;
    domains: string | null;
}

interface CandidateLocationPreferenceRow {
    id: string;
    candidate_profile_id: string;
    city: string | null;
    state: string | null;
    country: string;
    max_commute_minutes: number | null;
}

interface CandidateEmploymentTypeRow {
    id: string;
    candidate_profile_id: string;
    employment_type: EmploymentType;
}

export class SqliteJobCandidateProfileRepository implements IJobCandidateProfileRepository {
    private readonly insertProfileStatement: Database.Statement;
    private readonly updateProfileStatement: Database.Statement;
    private readonly deleteProfileStatement: Database.Statement;
    private readonly getProfileByIdStatement: Database.Statement;
    private readonly getAllProfilesStatement: Database.Statement;

    private readonly insertSkillStatement: Database.Statement;
    private readonly deleteSkillsStatement: Database.Statement;
    private readonly getSkillsByProfileIdStatement: Database.Statement;

    private readonly insertExperienceStatement: Database.Statement;
    private readonly deleteExperiencesStatement: Database.Statement;
    private readonly getExperiencesByProfileIdStatement: Database.Statement;

    private readonly insertLocationPreferenceStatement: Database.Statement;
    private readonly deleteLocationPreferencesStatement: Database.Statement;
    private readonly getLocationPreferencesByProfileIdStatement: Database.Statement;

    private readonly insertEmploymentTypeStatement: Database.Statement;
    private readonly deleteEmploymentTypesStatement: Database.Statement;
    private readonly getEmploymentTypesByProfileIdStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        // Profile statements
        this.insertProfileStatement = connection.prepare(`
            INSERT INTO candidate_profiles (
                id, current_title, total_years_experience,
                education_json, work_auth_citizenship_country, work_auth_authorized_in_us, work_auth_requires_sponsorship,
                strengths, desired_work, desired_growth_areas, avoid_work,
                career_priorities_technical_ownership, career_priorities_architecture_depth,
                career_priorities_skill_portability, career_priorities_learning_opportunity,
                career_priorities_compensation, career_priorities_stability,
                career_priorities_work_life_balance,
                preferences_work_arrangements, preferences_compensation_minimum_base_salary,
                preferences_compensation_target_base_salary, preferences_compensation_consider_variable_compensation,
                constraints_requires_remote_or_approved_hybrid_location, constraints_requires_sponsorship,
                constraints_hard_constraints
            ) VALUES (
                @id, @currentTitle, @totalYearsExperience,
                @educationJson, @workAuthCitizenshipCountry, @workAuthAuthorizedInUS, @workAuthRequiresSponsorship,
                @strengths, @desiredWork, @desiredGrowthAreas, @avoidWork,
                @careerPrioritiesTechnicalOwnership, @careerPrioritiesArchitectureDepth,
                @careerPrioritiesSkillPortability, @careerPrioritiesLearningOpportunity,
                @careerPrioritiesCompensation, @careerPrioritiesStability,
                @careerPrioritiesWorkLifeBalance,
                @preferencesWorkArrangements, @preferencesCompensationMinimumBaseSalary,
                @preferencesCompensationTargetBaseSalary, @preferencesCompensationConsiderVariableCompensation,
                @constraintsRequiresRemoteOrApprovedHybridLocation, @constraintsRequiresSponsorship,
                @constraintsHardConstraints
            )
        `);

        this.updateProfileStatement = connection.prepare(`
            UPDATE candidate_profiles SET
                current_title = @currentTitle,
                total_years_experience = @totalYearsExperience,
                education_json = @educationJson,
                work_auth_citizenship_country = @workAuthCitizenshipCountry,
                work_auth_authorized_in_us = @workAuthAuthorizedInUS,
                work_auth_requires_sponsorship = @workAuthRequiresSponsorship,
                strengths = @strengths,
                desired_work = @desiredWork,
                desired_growth_areas = @desiredGrowthAreas,
                avoid_work = @avoidWork,
                career_priorities_technical_ownership = @careerPrioritiesTechnicalOwnership,
                career_priorities_architecture_depth = @careerPrioritiesArchitectureDepth,
                career_priorities_skill_portability = @careerPrioritiesSkillPortability,
                career_priorities_learning_opportunity = @careerPrioritiesLearningOpportunity,
                career_priorities_compensation = @careerPrioritiesCompensation,
                career_priorities_stability = @careerPrioritiesStability,
                career_priorities_work_life_balance = @careerPrioritiesWorkLifeBalance,
                preferences_work_arrangements = @preferencesWorkArrangements,
                preferences_compensation_minimum_base_salary = @preferencesCompensationMinimumBaseSalary,
                preferences_compensation_target_base_salary = @preferencesCompensationTargetBaseSalary,
                preferences_compensation_consider_variable_compensation = @preferencesCompensationConsiderVariableCompensation,
                constraints_requires_remote_or_approved_hybrid_location = @constraintsRequiresRemoteOrApprovedHybridLocation,
                constraints_requires_sponsorship = @constraintsRequiresSponsorship,
                constraints_hard_constraints = @constraintsHardConstraints
            WHERE id = @id
        `);

        this.deleteProfileStatement = connection.prepare(`
            DELETE FROM candidate_profiles WHERE id = @id
        `);

        this.getProfileByIdStatement = connection.prepare(`
            SELECT * FROM candidate_profiles WHERE id = @id LIMIT 1
        `);

        this.getAllProfilesStatement = connection.prepare(`
            SELECT * FROM candidate_profiles ORDER BY id
        `);

        // Skill statements
        this.insertSkillStatement = connection.prepare(`
            INSERT INTO candidate_skills (
                id, candidate_profile_id, name, category, level, years, production_experience, context
            ) VALUES (
                @id, @candidateProfileId, @name, @category, @level, @years, @productionExperience, @context
            )
        `);

        this.deleteSkillsStatement = connection.prepare(`
            DELETE FROM candidate_skills WHERE candidate_profile_id = @candidateProfileId
        `);

        this.getSkillsByProfileIdStatement = connection.prepare(`
            SELECT * FROM candidate_skills WHERE candidate_profile_id = @candidateProfileId ORDER BY name
        `);

        // Experience statements
        this.insertExperienceStatement = connection.prepare(`
            INSERT INTO candidate_experience (
                id, candidate_profile_id, title, company, start_date, end_date, current, highlights, domains
            ) VALUES (
                @id, @candidateProfileId, @title, @company, @startDate, @endDate, @current, @highlights, @domains
            )
        `);

        this.deleteExperiencesStatement = connection.prepare(`
            DELETE FROM candidate_experience WHERE candidate_profile_id = @candidateProfileId
        `);

        this.getExperiencesByProfileIdStatement = connection.prepare(`
            SELECT * FROM candidate_experience WHERE candidate_profile_id = @candidateProfileId ORDER BY start_date DESC
        `);

        // Location preference statements
        this.insertLocationPreferenceStatement = connection.prepare(`
            INSERT INTO candidate_location_preferences (
                id, candidate_profile_id, city, state, country, max_commute_minutes
            ) VALUES (
                @id, @candidateProfileId, @city, @state, @country, @maxCommuteMinutes
            )
        `);

        this.deleteLocationPreferencesStatement = connection.prepare(`
            DELETE FROM candidate_location_preferences WHERE candidate_profile_id = @candidateProfileId
        `);

        this.getLocationPreferencesByProfileIdStatement = connection.prepare(`
            SELECT * FROM candidate_location_preferences WHERE candidate_profile_id = @candidateProfileId ORDER BY country, state, city
        `);

        // Employment type statements
        this.insertEmploymentTypeStatement = connection.prepare(`
            INSERT INTO candidate_employment_types (
                id, candidate_profile_id, employment_type
            ) VALUES (
                @id, @candidateProfileId, @employmentType
            )
        `);

        this.deleteEmploymentTypesStatement = connection.prepare(`
            DELETE FROM candidate_employment_types WHERE candidate_profile_id = @candidateProfileId
        `);

        this.getEmploymentTypesByProfileIdStatement = connection.prepare(`
            SELECT * FROM candidate_employment_types WHERE candidate_profile_id = @candidateProfileId ORDER BY employment_type
        `);
    }

    public async createCandidateProfile(profile: ICandidateProfile): Promise<ICandidateProfile> {
        this.logger.debug(`[JobCandidateProfileRepository.createCandidateProfile] Creating profile: ${profile.id}`);

        const persist = this.connection.transaction((profile: ICandidateProfile) => {
            this.persistProfile(profile);
            this.persistSkills(profile);
            this.persistExperiences(profile);
            this.persistLocationPreferences(profile);
            this.persistEmploymentTypes(profile);
        });

        persist(profile);

        this.logger.info(`[JobCandidateProfileRepository.createCandidateProfile] Created profile: ${profile.id}`);
        return profile;
    }

    public async getCandidateProfileById(id: string): Promise<ICandidateProfile | null> {
        this.logger.debug(`[JobCandidateProfileRepository.getCandidateProfileById] Getting profile by ID: ${id}`);

        const profileRow = this.getProfileByIdStatement.get({ id }) as CandidateProfileRow | undefined;

        if (!profileRow) {
            this.logger.debug(`[JobCandidateProfileRepository.getCandidateProfileById] Profile not found: ${id}`);
            return null;
        }

        const profile = this.mapProfileRow(profileRow);

        // Load related data
        profile.skills = this.getSkillsForProfile(id);
        profile.experience = this.getExperiencesForProfile(id);
        profile.preferences.locations = this.getLocationPreferencesForProfile(id);
        profile.preferences.employmentTypes = this.getEmploymentTypesForProfile(id) || undefined;

        this.logger.debug(`[JobCandidateProfileRepository.getCandidateProfileById] Retrieved profile: ${id}`);
        return profile;
    }

    public async getCandidateProfileByIdOrThrow(id: string): Promise<ICandidateProfile> {
        const result = await this.getCandidateProfileById(id);
        if (!result) {
            this.logger.error(
                `[JobCandidateProfileRepository.getCandidateProfileByIdOrThrow] Candidate profile with Id ${id} does not exist.`
            );
            throw new Error(
                `[JobCandidateProfileRepository.getCandidateProfileByIdOrThrow] Candidate profile with Id ${id} does not exist.`
            );
        }
        return result;
    }

    public async getCandidateProfiles(): Promise<ICandidateProfile[]> {
        this.logger.debug(`[JobCandidateProfileRepository.getCandidateProfiles] Getting all profiles`);

        const profileRows = this.getAllProfilesStatement.all() as CandidateProfileRow[];

        const profiles = profileRows.map(row => {
            const profile = this.mapProfileRow(row);

            // Load related data for each profile
            profile.skills = this.getSkillsForProfile(profile.id);
            profile.experience = this.getExperiencesForProfile(profile.id);
            profile.preferences.locations = this.getLocationPreferencesForProfile(profile.id);
            profile.preferences.employmentTypes = this.getEmploymentTypesForProfile(profile.id) || undefined;

            return profile;
        });

        this.logger.debug(`[JobCandidateProfileRepository.getCandidateProfiles] Retrieved ${profiles.length} profiles`);
        return profiles;
    }

    public async updateCandidateProfile(profile: ICandidateProfile): Promise<ICandidateProfile> {
        this.logger.debug(`[JobCandidateProfileRepository.updateCandidateProfile] Updating profile: ${profile.id}`);

        const persist = this.connection.transaction((profile: ICandidateProfile) => {
            this.updateProfile(profile);
            this.deleteAndRecreateSkills(profile);
            this.deleteAndRecreateExperiences(profile);
            this.deleteAndRecreateLocationPreferences(profile);
            this.deleteAndRecreateEmploymentTypes(profile);
        });

        persist(profile);

        this.logger.info(`[JobCandidateProfileRepository.updateCandidateProfile] Updated profile: ${profile.id}`);
        return profile;
    }

    public async deleteCandidateProfile(id: string): Promise<void> {
        this.logger.debug(`[JobCandidateProfileRepository.deleteCandidateProfile] Deleting profile: ${id}`);

        const persist = this.connection.transaction((id: string) => {
            this.deleteSkillsStatement.run({ candidateProfileId: id });
            this.deleteExperiencesStatement.run({ candidateProfileId: id });
            this.deleteLocationPreferencesStatement.run({ candidateProfileId: id });
            this.deleteEmploymentTypesStatement.run({ candidateProfileId: id });
            this.deleteProfileStatement.run({ id });
        });

        persist(id);

        this.logger.info(`[JobCandidateProfileRepository.deleteCandidateProfile] Deleted profile: ${id}`);
    }

    private persistProfile(profile: ICandidateProfile): void {
        const params = {
            id: profile.id,
            currentTitle: profile.currentTitle ?? null,
            totalYearsExperience: profile.totalYearsExperience,
            educationJson: JSON.stringify(profile.education),
            workAuthCitizenshipCountry: profile.workAuthorization.citizenshipCountry,
            workAuthAuthorizedInUS: profile.workAuthorization.authorizedToWorkInUS ? 1 : 0,
            workAuthRequiresSponsorship: profile.workAuthorization.requiresSponsorship ? 1 : 0,
            strengths: JSON.stringify(profile.strengths),
            desiredWork: JSON.stringify(profile.desiredWork),
            desiredGrowthAreas: JSON.stringify(profile.desiredGrowthAreas),
            avoidWork: JSON.stringify(profile.avoidWork),
            careerPrioritiesTechnicalOwnership: profile.careerPriorities.technicalOwnership,
            careerPrioritiesArchitectureDepth: profile.careerPriorities.architectureDepth,
            careerPrioritiesSkillPortability: profile.careerPriorities.skillPortability,
            careerPrioritiesLearningOpportunity: profile.careerPriorities.learningOpportunity,
            careerPrioritiesCompensation: profile.careerPriorities.compensation,
            careerPrioritiesStability: profile.careerPriorities.stability,
            careerPrioritiesWorkLifeBalance: profile.careerPriorities.workLifeBalance ?? null,
            preferencesWorkArrangements: JSON.stringify(profile.preferences.workArrangements),
            preferencesCompensationMinimumBaseSalary: profile.preferences.compensation.minimumBaseSalary ?? null,
            preferencesCompensationTargetBaseSalary: profile.preferences.compensation.targetBaseSalary ?? null,
            preferencesCompensationConsiderVariableCompensation: profile.preferences.compensation
                .considerVariableCompensation
                ? 1
                : 0,
            constraintsRequiresRemoteOrApprovedHybridLocation: profile.constraints
                .requiresRemoteOrApprovedHybridLocation
                ? 1
                : 0,
            constraintsRequiresSponsorship: profile.constraints.requiresSponsorship ? 1 : 0,
            constraintsHardConstraints: profile.constraints.hardConstraints
                ? JSON.stringify(profile.constraints.hardConstraints)
                : null,
        };

        this.insertProfileStatement.run(params);
    }

    private updateProfile(profile: ICandidateProfile): void {
        const params = {
            id: profile.id,
            currentTitle: profile.currentTitle ?? null,
            totalYearsExperience: profile.totalYearsExperience,
            educationJson: JSON.stringify(profile.education),
            workAuthCitizenshipCountry: profile.workAuthorization.citizenshipCountry,
            workAuthAuthorizedInUS: profile.workAuthorization.authorizedToWorkInUS ? 1 : 0,
            workAuthRequiresSponsorship: profile.workAuthorization.requiresSponsorship ? 1 : 0,
            strengths: JSON.stringify(profile.strengths),
            desiredWork: JSON.stringify(profile.desiredWork),
            desiredGrowthAreas: JSON.stringify(profile.desiredGrowthAreas),
            avoidWork: JSON.stringify(profile.avoidWork),
            careerPrioritiesTechnicalOwnership: profile.careerPriorities.technicalOwnership,
            careerPrioritiesArchitectureDepth: profile.careerPriorities.architectureDepth,
            careerPrioritiesSkillPortability: profile.careerPriorities.skillPortability,
            careerPrioritiesLearningOpportunity: profile.careerPriorities.learningOpportunity,
            careerPrioritiesCompensation: profile.careerPriorities.compensation,
            careerPrioritiesStability: profile.careerPriorities.stability,
            careerPrioritiesWorkLifeBalance: profile.careerPriorities.workLifeBalance ?? null,
            preferencesWorkArrangements: JSON.stringify(profile.preferences.workArrangements),
            preferencesCompensationMinimumBaseSalary: profile.preferences.compensation.minimumBaseSalary ?? null,
            preferencesCompensationTargetBaseSalary: profile.preferences.compensation.targetBaseSalary ?? null,
            preferencesCompensationConsiderVariableCompensation: profile.preferences.compensation
                .considerVariableCompensation
                ? 1
                : 0,
            constraintsRequiresRemoteOrApprovedHybridLocation: profile.constraints
                .requiresRemoteOrApprovedHybridLocation
                ? 1
                : 0,
            constraintsRequiresSponsorship: profile.constraints.requiresSponsorship ? 1 : 0,
            constraintsHardConstraints: profile.constraints.hardConstraints
                ? JSON.stringify(profile.constraints.hardConstraints)
                : null,
        };

        this.updateProfileStatement.run(params);
    }

    private persistSkills(profile: ICandidateProfile): void {
        for (const skill of profile.skills) {
            const params = {
                id: randomUUID(),
                candidateProfileId: profile.id,
                name: skill.name,
                category: skill.category,
                level: skill.level,
                years: skill.years ?? null,
                productionExperience: skill.productionExperience ? 1 : 0,
                context: skill.context ?? null,
            };
            this.insertSkillStatement.run(params);
        }
    }

    private persistExperiences(profile: ICandidateProfile): void {
        for (const experience of profile.experience) {
            const params = {
                id: randomUUID(),
                candidateProfileId: profile.id,
                title: experience.title,
                company: experience.company,
                startDate: experience.startDate ?? null,
                endDate: experience.endDate ?? null,
                current: experience.current ? 1 : 0,
                highlights: JSON.stringify(experience.highlights),
                domains: experience.domains ? JSON.stringify(experience.domains) : null,
            };
            this.insertExperienceStatement.run(params);
        }
    }

    private persistLocationPreferences(profile: ICandidateProfile): void {
        for (const location of profile.preferences.locations) {
            const params = {
                id: randomUUID(),
                candidateProfileId: profile.id,
                city: location.city ?? null,
                state: location.state ?? null,
                country: location.country,
                maxCommuteMinutes: location.maxCommuteMinutes ?? null,
            };
            this.insertLocationPreferenceStatement.run(params);
        }
    }

    private persistEmploymentTypes(profile: ICandidateProfile): void {
        if (profile.preferences.employmentTypes) {
            for (const employmentType of profile.preferences.employmentTypes) {
                const params = {
                    id: randomUUID(),
                    candidateProfileId: profile.id,
                    employmentType: employmentType,
                };
                this.insertEmploymentTypeStatement.run(params);
            }
        }
    }

    private getSkillsForProfile(profileId: string): ISkill[] {
        const rows = this.getSkillsByProfileIdStatement.all({ candidateProfileId: profileId }) as CandidateSkillRow[];
        return rows.map(row => ({
            name: row.name,
            category: row.category,
            level: row.level,
            years: row.years ?? undefined,
            productionExperience: row.production_experience === 1,
            context: row.context ?? undefined,
        }));
    }

    private getExperiencesForProfile(profileId: string): ICandidateExperience[] {
        const rows = this.getExperiencesByProfileIdStatement.all({
            candidateProfileId: profileId,
        }) as CandidateExperienceRow[];
        return rows.map(row => ({
            title: row.title,
            company: row.company,
            startDate: row.start_date ?? undefined,
            endDate: row.end_date ?? undefined,
            current: row.current === 1,
            highlights: JSON.parse(row.highlights),
            domains: row.domains ? JSON.parse(row.domains) : undefined,
        }));
    }

    private getLocationPreferencesForProfile(profileId: string): ILocationPreference[] {
        const rows = this.getLocationPreferencesByProfileIdStatement.all({
            candidateProfileId: profileId,
        }) as CandidateLocationPreferenceRow[];
        return rows.map(row => ({
            city: row.city ?? undefined,
            state: row.state ?? undefined,
            country: row.country,
            maxCommuteMinutes: row.max_commute_minutes ?? undefined,
        }));
    }

    private getEmploymentTypesForProfile(profileId: string): EmploymentType[] | undefined {
        const rows = this.getEmploymentTypesByProfileIdStatement.all({
            candidateProfileId: profileId,
        }) as CandidateEmploymentTypeRow[];
        return rows.length > 0 ? rows.map(row => row.employment_type) : undefined;
    }

    private deleteAndRecreateSkills(profile: ICandidateProfile): void {
        this.deleteSkillsStatement.run({ candidateProfileId: profile.id });
        this.persistSkills(profile);
    }

    private deleteAndRecreateExperiences(profile: ICandidateProfile): void {
        this.deleteExperiencesStatement.run({ candidateProfileId: profile.id });
        this.persistExperiences(profile);
    }

    private deleteAndRecreateLocationPreferences(profile: ICandidateProfile): void {
        this.deleteLocationPreferencesStatement.run({ candidateProfileId: profile.id });
        this.persistLocationPreferences(profile);
    }

    private deleteAndRecreateEmploymentTypes(profile: ICandidateProfile): void {
        this.deleteEmploymentTypesStatement.run({ candidateProfileId: profile.id });
        this.persistEmploymentTypes(profile);
    }

    private mapProfileRow(row: CandidateProfileRow): ICandidateProfile {
        return {
            id: row.id,
            currentTitle: row.current_title ?? undefined,
            totalYearsExperience: row.total_years_experience,
            workAuthorization: {
                citizenshipCountry: row.work_auth_citizenship_country!,
                authorizedToWorkInUS: row.work_auth_authorized_in_us === 1,
                requiresSponsorship: row.work_auth_requires_sponsorship === 1,
            },
            education: row.education_json ? JSON.parse(row.education_json) : [],
            skills: [], // Will be populated separately
            experience: [], // Will be populated separately
            strengths: JSON.parse(row.strengths),
            desiredWork: JSON.parse(row.desired_work),
            desiredGrowthAreas: JSON.parse(row.desired_growth_areas),
            avoidWork: JSON.parse(row.avoid_work),
            careerPriorities: {
                technicalOwnership: row.career_priorities_technical_ownership,
                architectureDepth: row.career_priorities_architecture_depth,
                skillPortability: row.career_priorities_skill_portability,
                learningOpportunity: row.career_priorities_learning_opportunity,
                compensation: row.career_priorities_compensation,
                stability: row.career_priorities_stability,
                workLifeBalance: row.career_priorities_work_life_balance ?? undefined,
            },
            preferences: {
                workArrangements: JSON.parse(row.preferences_work_arrangements),
                locations: [], // Will be populated separately
                compensation: {
                    minimumBaseSalary: row.preferences_compensation_minimum_base_salary ?? undefined,
                    targetBaseSalary: row.preferences_compensation_target_base_salary ?? undefined,
                    considerVariableCompensation: row.preferences_compensation_consider_variable_compensation === 1,
                },
                employmentTypes: undefined, // Will be populated separately
            },
            constraints: {
                requiresRemoteOrApprovedHybridLocation:
                    row.constraints_requires_remote_or_approved_hybrid_location === 1,
                requiresSponsorship: row.constraints_requires_sponsorship === 1,
                hardConstraints: row.constraints_hard_constraints
                    ? JSON.parse(row.constraints_hard_constraints)
                    : undefined,
            },
        };
    }
}
