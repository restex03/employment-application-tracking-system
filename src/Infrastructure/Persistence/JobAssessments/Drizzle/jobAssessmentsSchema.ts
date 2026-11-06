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
        id: text().primaryKey().notNull(),
        candidateProfileId: text().notNull(),
        jobPostId: text().notNull(),
        createdAt: text().notNull(),
        status: text().$type<JobAssessmentStatus>().notNull(),
        reviewStatus: text().$type<JobAssessmentReviewStatus>().notNull(),
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
