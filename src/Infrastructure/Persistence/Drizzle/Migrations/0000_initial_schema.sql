CREATE TABLE IF NOT EXISTS "JobPosts" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "sourceId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "requisitionId" TEXT,
    "title" TEXT NOT NULL,
    "detailPath" TEXT NOT NULL,
    "jobLink" TEXT NOT NULL,
    "locations" TEXT NOT NULL DEFAULT '[]' CHECK (json_valid("locations")),
    "postedDate" TEXT,
    "importedDate" INTEGER NOT NULL,
    "detail" TEXT NOT NULL CHECK (json_valid("detail")),
    "remoteType" TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id TEXT PRIMARY KEY NOT NULL,
    current_title TEXT,
    total_years_experience INTEGER NOT NULL,
    education_json TEXT,
    work_auth_citizenship_country TEXT,
    work_auth_authorized_in_us INTEGER,
    work_auth_requires_sponsorship INTEGER,
    strengths TEXT,
    preferences_work_arrangements TEXT,
    preferences_compensation_minimum_base_salary INTEGER,
    preferences_compensation_target_base_salary INTEGER,
    preferences_compensation_consider_variable_compensation INTEGER,
    constraints_requires_remote_or_approved_hybrid_location INTEGER,
    constraints_requires_sponsorship INTEGER,
    constraints_hard_constraints TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS candidate_skills (
    id TEXT PRIMARY KEY NOT NULL,
    candidate_profile_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    years INTEGER,
    production_experience INTEGER,
    context TEXT,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);
--> statement-breakpoint
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
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS candidate_location_preferences (
    id TEXT PRIMARY KEY NOT NULL,
    candidate_profile_id TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT NOT NULL,
    max_commute_minutes INTEGER,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS candidate_employment_types (
    id TEXT PRIMARY KEY NOT NULL,
    candidate_profile_id TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);
--> statement-breakpoint
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
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_assessments_candidate_profile
    ON job_assessments(candidate_profile_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_assessments_job_post
    ON job_assessments(job_post_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_assessments_created_at
    ON job_assessments(created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_assessment_job_queue (
    id TEXT PRIMARY KEY NOT NULL,
    job_post_id TEXT NOT NULL,
    candidate_profile_id TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    warnings TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_job_assessment_job_queue_status_created_at
    ON job_assessment_job_queue(status, created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS ux_job_assessment_job_queue_active
    ON job_assessment_job_queue(job_post_id, candidate_profile_id)
    WHERE status IN ('QUEUED', 'IN_PROGRESS');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY NOT NULL,
    job_post_id TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    attachments TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_job_applications_job_post_id
    ON job_applications(job_post_id);
