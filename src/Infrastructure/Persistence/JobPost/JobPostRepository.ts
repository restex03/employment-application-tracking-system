import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { JobPostQueryFilters } from "../../JobPosts/IJobPostGateway";
import { IJobPostRepository } from "./IJobPostRepository";
import { createJobPostFilters, createJobPostOrderBy } from "./Drizzle/jobPostQueryExpressions";
import { jobPosts } from "./Drizzle/jobPostsSchema";

const schema = { jobPosts };
type JobPostsDatabase = BetterSQLite3Database<typeof schema>;
const upsertSet = {
    sourceId: sql.raw('excluded."sourceId"'),
    companyName: sql.raw('excluded."companyName"'),
    requisitionId: sql.raw('excluded."requisitionId"'),
    title: sql.raw('excluded."title"'),
    detailPath: sql.raw('excluded."detailPath"'),
    jobLink: sql.raw('excluded."jobLink"'),
    locations: sql.raw('excluded."locations"'),
    postedDate: sql.raw('excluded."postedDate"'),
    importedDate: sql.raw('excluded."importedDate"'),
    detail: sql.raw('excluded."detail"'),
    remoteType: sql.raw('excluded."remoteType"'),
};

export class JobPostRepository implements IJobPostRepository {
    private readonly database: JobPostsDatabase;

    constructor(connection: Database.Database) {
        this.database = drizzle(connection, { schema });
    }

    async getById(id: string): Promise<IJobPost | undefined> {
        const [jobPost] = await this.database.select().from(jobPosts).where(eq(jobPosts.id, id)).limit(1);
        return jobPost ? this.toJobPost(jobPost) : undefined;
    }

    async getLatestJob(): Promise<IJobPost | undefined> {
        const [jobPost] = await this.database
            .select()
            .from(jobPosts)
            .orderBy(desc(jobPosts.importedDate), asc(jobPosts.id))
            .limit(1);
        return jobPost ? this.toJobPost(jobPost) : undefined;
    }

    async list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPost[]; totalCount: number }> {
        if (!Number.isSafeInteger(pageCount) || pageCount < 1 || !Number.isSafeInteger(pageNumber) || pageNumber < 1) {
            throw new RangeError("pageCount and pageNumber must be positive integers.");
        }

        const filters = createJobPostFilters(queryFilters);
        const where = filters.length > 0 ? and(...filters) : undefined;
        const [{ totalCount }] = await this.database.select({ totalCount: count() }).from(jobPosts).where(where);
        const data = await this.database
            .select()
            .from(jobPosts)
            .where(where)
            .orderBy(...createJobPostOrderBy(queryFilters))
            .limit(pageCount)
            .offset((pageNumber - 1) * pageCount);

        return { data: data.map(jobPost => this.toJobPost(jobPost)), totalCount };
    }

    async upsert(jobPost: IJobPost): Promise<void> {
        const values = this.toInsertValues(jobPost);
        await this.database.insert(jobPosts).values(values).onConflictDoUpdate({
            target: jobPosts.id,
            set: values,
        });
    }

    async upsertMany(jobPostsToUpsert: IJobPost[]): Promise<void> {
        if (jobPostsToUpsert.length === 0) {
            return;
        }

        const values = jobPostsToUpsert.map(jobPost => this.toInsertValues(jobPost));
        this.database.transaction(transaction => {
            for (let index = 0; index < values.length; index += 50) {
                transaction
                    .insert(jobPosts)
                    .values(values.slice(index, index + 50))
                    .onConflictDoUpdate({
                        target: jobPosts.id,
                        set: upsertSet,
                    })
                    .run();
            }
        });
    }

    private toInsertValues(jobPost: IJobPost) {
        return {
            id: jobPost.id,
            sourceId: jobPost.sourceId,
            companyName: jobPost.companyName,
            requisitionId: jobPost.requisitionId ?? null,
            title: jobPost.title,
            detailPath: jobPost.detailPath,
            jobLink: jobPost.jobLink,
            locations: jobPost.locations ?? [],
            postedDate: jobPost.postedDate ?? null,
            importedDate: jobPost.importedDate,
            detail: jobPost.detail,
            remoteType: jobPost.remoteType ?? null,
        };
    }

    private toJobPost(jobPost: typeof jobPosts.$inferSelect): IJobPost {
        return {
            ...jobPost,
            requisitionId: jobPost.requisitionId ?? undefined,
            remoteType: jobPost.remoteType ?? undefined,
        };
    }
}
