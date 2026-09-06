import Database from "better-sqlite3";

export class SqliteDatabaseConnection {
    public readonly db: Database.Database;

    constructor(databasePath: string) {
        this.db = new Database(databasePath);

        this.db.pragma("journal_mode = WAL");
        this.db.pragma("foreign_keys = ON");

        this.initialize();
    }

    public close(): void {
        this.db.close();
    }

    private initialize(): void {
        this.createSchema();
    }

    private createSchema(): void {
        this.createWorkdayJobSourcesTable();
        this.createJobPostsTable();
        this.createJobPostDetailsTable();
        this.createCandidateProfilesTable();
        this.createJobAssessmentsTable();
    }

    private createWorkdayJobSourcesTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS workday_job_sources (
                id TEXT PRIMARY KEY NOT NULL,
                company_name TEXT NOT NULL,
                base_url TEXT NOT NULL UNIQUE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_workday_job_sources_company_name
            ON workday_job_sources(company_name);
        `);
    }

    private createJobPostsTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS job_posts (
                id TEXT PRIMARY KEY NOT NULL,
                source_id TEXT NOT NULL,
                requisition_id TEXT,
                title TEXT NOT NULL,
                detail_path TEXT NOT NULL,
                locations TEXT,
                posted_date TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (source_id)
                    REFERENCES workday_job_sources(id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_job_posts_source_detail_path
            ON job_posts(source_id, detail_path);
        `);
    }

    private createJobPostDetailsTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS job_post_details (
                id TEXT PRIMARY KEY NOT NULL,
                job_post_id TEXT NOT NULL UNIQUE,

                description TEXT NOT NULL,
                employment_type TEXT,
                locations TEXT,
                valid_through TEXT,
                remote_type TEXT,
                applicant_locations TEXT,

                fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (job_post_id)
                    REFERENCES job_posts(id)
                    ON DELETE CASCADE
            );
        `);
    }

    private createCandidateProfilesTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS candidate_profiles (
                id TEXT PRIMARY KEY NOT NULL,
                current_title TEXT,
                total_years_experience INTEGER NOT NULL,
                education_degree TEXT,
                education_field TEXT,
                strengths TEXT,
                desired_work TEXT,
                desired_growth_areas TEXT,
                avoid_work TEXT,
                career_priorities_technical_ownership INTEGER,
                career_priorities_architecture_depth INTEGER,
                career_priorities_skill_portability INTEGER,
                career_priorities_learning_opportunity INTEGER,
                career_priorities_compensation INTEGER,
                career_priorities_stability INTEGER,
                career_priorities_work_life_balance INTEGER,
                preferences_work_arrangements TEXT,
                preferences_compensation_minimum_base_salary INTEGER,
                preferences_compensation_target_base_salary INTEGER,
                preferences_compensation_consider_variable_compensation INTEGER,
                constraints_requires_remote_or_approved_hybrid_location INTEGER,
                constraints_requires_sponsorship INTEGER,
                constraints_hard_constraints TEXT
            );

            CREATE TABLE IF NOT EXISTS candidate_skills (
                id TEXT PRIMARY KEY NOT NULL,
                candidate_profile_id TEXT NOT NULL,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                level TEXT NOT NULL,
                years INTEGER,
                production_experience INTEGER,
                context TEXT,

                FOREIGN KEY (candidate_profile_id)
                    REFERENCES candidate_profiles(id)
                    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS candidate_experience (
                id TEXT PRIMARY KEY NOT NULL,
                candidate_profile_id TEXT NOT NULL,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                current INTEGER,
                highlights TEXT,
                domains TEXT,

                FOREIGN KEY (candidate_profile_id)
                    REFERENCES candidate_profiles(id)
                    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS candidate_location_preferences (
                id TEXT PRIMARY KEY NOT NULL,
                candidate_profile_id TEXT NOT NULL,
                city TEXT,
                state TEXT,
                country TEXT NOT NULL,
                max_commute_minutes INTEGER,

                FOREIGN KEY (candidate_profile_id)
                    REFERENCES candidate_profiles(id)
                    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS candidate_employment_types (
                id TEXT PRIMARY KEY NOT NULL,
                candidate_profile_id TEXT NOT NULL,
                employment_type TEXT NOT NULL,

                FOREIGN KEY (candidate_profile_id)
                    REFERENCES candidate_profiles(id)
                    ON DELETE CASCADE
            );
        `);
    }

    private createJobAssessmentsTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS job_assessments (
                id TEXT PRIMARY KEY NOT NULL,
                candidate_profile_id TEXT NOT NULL,
                job_post_id TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL,
                review_status TEXT NOT NULL,
                screen_result_json TEXT,
                requirements_json TEXT,
                requirement_matches_json TEXT,
                job_match_score_json TEXT,

                FOREIGN KEY (candidate_profile_id)
                    REFERENCES candidate_profiles(id),
                FOREIGN KEY (job_post_id)
                    REFERENCES job_posts(id)
            );

            CREATE INDEX IF NOT EXISTS idx_job_assessments_candidate_profile
            ON job_assessments(candidate_profile_id);

            CREATE INDEX IF NOT EXISTS idx_job_assessments_job_post
            ON job_assessments(job_post_id);

            CREATE INDEX IF NOT EXISTS idx_job_assessments_created_at
            ON job_assessments(created_at);
        `);
    }
}
