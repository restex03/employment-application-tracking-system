import { and, asc, count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import type { SQLiteTable, SQLiteUpdateSetSource } from "drizzle-orm/sqlite-core";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { JobPostQueryFilters } from "../../JobPosts/IJobPostGateway";
import { IJobPostRepository } from "./IJobPostRepository";
import type { AppDatabase } from "../SqliteDatabaseProvider";
import { createJobPostFilters, createJobPostOrderBy } from "./Drizzle/jobPostQueryExpressions";
import { jobPosts } from "../Drizzle/schema";

function createUpsertSet<TTable extends SQLiteTable>(table: TTable): SQLiteUpdateSetSource<TTable> {
    const set = Object.fromEntries(
        Object.entries(getTableColumns(table)).map(([key, column]) => [
            key,
            sql`${sql.identifier("excluded")}.${sql.identifier(column.name)}`,
        ])
    );
    return set as SQLiteUpdateSetSource<TTable>;
}

const upsertSet = createUpsertSet(jobPosts);

export class JobPostRepository implements IJobPostRepository {
    constructor(private readonly database: AppDatabase) {}

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
