import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { IJobApplicationAttachment, JobApplicationStatus } from "../../../../Domain/JobApplications/IJobApplication";

export const jobApplications = sqliteTable(
    "job_applications",
    {
        id: text("id").primaryKey().notNull(),
        jobPostId: text("job_post_id").notNull(),
        status: text("status").$type<JobApplicationStatus>().notNull(),
        notes: text("notes").notNull().default(""),
        attachments: text("attachments", { mode: "json" })
            .$type<IJobApplicationAttachment[]>()
            .notNull()
            .default(sql`'[]'`),
        createdAt: text("created_at")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`),
    },
    table => [index("ix_job_applications_job_post_id").on(table.jobPostId)]
);
