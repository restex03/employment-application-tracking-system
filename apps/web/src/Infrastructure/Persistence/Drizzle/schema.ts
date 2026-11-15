import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { IJobRequirement } from "../../../Application/JobAssessment/RequirementsExtraction/IJobRequirement";
import { IJobRequirementMatch } from "../../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";
import { IJobScreenResult } from "../../../Application/JobAssessment/Screening/IJobScreenResult";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobApplicationAttachment, JobApplicationStatus } from "../../../Domain/JobApplications/IJobApplication";
import { JobAssessmentReviewStatus, JobAssessmentStatus } from "../../../Domain/JobAssessment/IJobAssessment";
import { IJobMatchScore } from "../../../Domain/JobAssessment/Scoring/IJobMatchScore";

export const jobPosts = sqliteTable("JobPosts", {
    id: text("id").primaryKey().notNull(),
    sourceId: text("sourceId").notNull(),
    companyName: text("companyName").notNull(),
    requisitionId: text("requisitionId"),
    title: text("title").notNull(),
    detailPath: text("detailPath").notNull(),
    jobLink: text("jobLink").notNull(),
    locations: text("locations", { mode: "json" })
        .$type<string[]>()
        .notNull()
        .default(sql`'[]'`),
    postedDate: text("postedDate"),
    importedDate: integer("importedDate", { mode: "timestamp_ms" }).notNull(),
    detail: text("detail", { mode: "json" }).$type<IJobPostDetail>().notNull(),
    remoteType: text("remoteType"),
});

export const jobApplications = sqliteTable(
    "job_applications",
    {
        id: text().primaryKey().notNull(),
        jobPostId: text().notNull(),
        status: text().$type<JobApplicationStatus>().notNull(),
        notes: text().notNull().default(""),
        attachments: text({ mode: "json" })
            .$type<IJobApplicationAttachment[]>()
            .notNull()
            .default(sql`'[]'`),
        createdAt: text()
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`),
    },
    table => [index("ix_job_applications_job_post_id").on(table.jobPostId)]
);

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

export const schema = { jobApplications, jobAssessments, jobPosts };
