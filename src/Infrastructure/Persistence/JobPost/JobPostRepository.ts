import { and, asc, count, desc, eq, gt, gte, sql } from "drizzle-orm";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { JobPostQueryFilters } from "../../JobPosts/IJobPostGateway";
import { IJobPostRepository } from "./IJobPostRepository";
import { jobPosts } from "./Drizzle/jobPostsSchema";

const schema = { jobPosts };
type JobPostsDatabase = BetterSQLite3Database<typeof schema>;

export class JobPostRepository implements IJobPostRepository {
    private readonly database: JobPostsDatabase;

    constructor(connection: Database.Database) {
        this.database = drizzle(connection, { schema });
    }

    async getById(id: string): Promise<IJobPost | undefined> {
        const [jobPost] = await this.database.select().from(jobPosts).where(eq(jobPosts.id, id)).limit(1);
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

        const filters = this.createFilters(queryFilters);
        const where = filters.length > 0 ? and(...filters) : undefined;
        const [{ totalCount }] = await this.database.select({ totalCount: count() }).from(jobPosts).where(where);
        const direction = queryFilters.sortDirection === "asc" ? asc : desc;
        const sortBy = queryFilters.sortBy ?? "postedDate";
        const sortColumn = {
            companyName: jobPosts.companyName,
            requisitionId: jobPosts.requisitionId,
            title: jobPosts.title,
            postedDate: jobPosts.postedDate,
        }[sortBy];
        const normalizedSortColumn = sql`lower(${sortColumn})`;
        const missingValue = sql`CASE WHEN ${sortColumn} IS NULL OR ${sortColumn} = '' THEN 1 ELSE 0 END`;
        const orderBy =
            sortBy === "postedDate"
                ? [asc(missingValue), direction(sql`julianday(${sortColumn})`), asc(jobPosts.id)]
                : [asc(missingValue), direction(normalizedSortColumn), asc(jobPosts.id)];
        const data = await this.database
            .select()
            .from(jobPosts)
            .where(where)
            .orderBy(...orderBy)
            .limit(pageCount)
            .offset((pageNumber - 1) * pageCount);

        return { data: data.map(jobPost => this.toJobPost(jobPost)), totalCount };
    }

    async upsert(jobPost: IJobPost): Promise<void> {
        const values = {
            id: jobPost.id,
            sourceId: jobPost.sourceId,
            companyName: jobPost.companyName,
            requisitionId: jobPost.requisitionId ?? null,
            title: jobPost.title,
            detailPath: jobPost.detailPath,
            jobLink: jobPost.jobLink,
            locations: jobPost.locations ?? [],
            postedDate: jobPost.postedDate ?? null,
            createdAt: jobPost.createdAt,
            detail: jobPost.detail,
            remoteType: jobPost.remoteType ?? null,
        };

        await this.database.insert(jobPosts).values(values).onConflictDoUpdate({
            target: jobPosts.id,
            set: values,
        });
    }

    private createFilters(queryFilters: JobPostQueryFilters) {
        const filters = [];
        if (queryFilters.companyName.trim()) {
            filters.push(this.containsIgnoreCase(jobPosts.companyName, queryFilters.companyName));
        }
        if (queryFilters.requisitionId.trim()) {
            filters.push(this.containsIgnoreCase(jobPosts.requisitionId, queryFilters.requisitionId));
        }
        if (queryFilters.title.trim()) {
            filters.push(this.containsIgnoreCase(jobPosts.title, queryFilters.title));
        }
        if (queryFilters.location.trim()) {
            filters.push(sql`EXISTS (
                SELECT 1
                FROM json_each(${jobPosts.locations})
                WHERE instr(lower(value), lower(${queryFilters.location.trim()})) > 0
            )`);
        }
        if (queryFilters.postedDate) {
            filters.push(gte(sql`julianday(${jobPosts.postedDate})`, sql`julianday(${queryFilters.postedDate})`));
        }

        return filters;
    }

    private containsIgnoreCase(
        column: typeof jobPosts.companyName | typeof jobPosts.requisitionId | typeof jobPosts.title,
        value: string
    ) {
        return gt(sql`instr(lower(${column}), lower(${value.trim()}))`, 0);
    }

    private toJobPost(jobPost: typeof jobPosts.$inferSelect): IJobPost {
        return {
            ...jobPost,
            requisitionId: jobPost.requisitionId ?? undefined,
            remoteType: jobPost.remoteType ?? undefined,
        };
    }
}
