import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { IJobApplicationAttachment, JobApplicationStatus } from "../../../../Domain/JobApplications/IJobApplication";

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
