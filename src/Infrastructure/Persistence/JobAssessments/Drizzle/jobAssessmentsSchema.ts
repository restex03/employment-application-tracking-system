import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
    IJobAssessment,
    JobAssessmentReviewStatus,
    JobAssessmentStatus,
} from "../../../../Domain/JobAssessment/IJobAssessment";
import { IJobMatchScore } from "../../../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { IJobRequirement } from "../../../../Application/JobAssessment/RequirementsExtraction/IJobRequirement";
import { IJobRequirementMatch } from "../../../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";
import { IJobScreenResult } from "../../../../Application/JobAssessment/Screening/IJobScreenResult";

export const jobAssessments = sqliteTable(
    "job_assessments",
    {
        id: text("id").primaryKey().notNull(),
        candidateProfileId: text("candidate_profile_id").notNull(),
        jobPostId: text("job_post_id").notNull(),
        createdAt: text("created_at").notNull(),
        status: text("status").$type<JobAssessmentStatus>().notNull(),
        reviewStatus: text("review_status").$type<JobAssessmentReviewStatus>().notNull(),
        screenResult: text("screen_result_json", { mode: "json" }).$type<IJobScreenResult>(),
        requirements: text("requirements_json", { mode: "json" }).$type<IJobRequirement[]>(),
        requirementMatches: text("requirement_matches_json", { mode: "json" }).$type<IJobRequirementMatch[]>(),
        jobMatchScore: text("job_match_score_json", { mode: "json" }).$type<IJobMatchScore>(),
    },
    table => [
        index("idx_job_assessments_candidate_profile").on(table.candidateProfileId),
        index("idx_job_assessments_job_post").on(table.jobPostId),
        index("idx_job_assessments_created_at").on(table.createdAt),
    ]
);
