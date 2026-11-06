import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { IJobPostDetail } from "../../../../Domain/JobPosts/IJobPostDetail";

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
