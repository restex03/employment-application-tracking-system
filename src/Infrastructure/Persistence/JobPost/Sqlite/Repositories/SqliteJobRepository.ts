import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

import { IJobPost, JobPost } from "../../../../../Domain/JobPosts/IJobPost";
import { IJobLocation, IJobPostDetail } from "../../../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostRepository } from "../../IJobPostRepository";
import { ILogger } from "../../../../Logging/ILogger";
import { JobPostQueryFilters } from "../../../../../Application/JobPost/IJobPostService";

interface JobPostParameters {
    id: string;
    sourceId: string;
    requisitionId: string | null;
    title: string;
    detailPath: string;
    locations: string | null;
    postedDate: string | null;
    remoteType: string | null;
    createdAt: string;
}

interface JobPostDetailParameters {
    id: string;
    jobPostId: string;
    description: string;
    employmentType: string | null;
    locations: string | null;
    validThrough: string | null;
    remoteType: string | null;
    applicantLocations: string | null;
}

interface JobPostDetailHydrationParameters {
    jobPostId: string;
    requisitionId: string | null;
    title: string;
    datePosted: string | null;
    remoteType: string | null;
}

interface JobPostIdRow {
    id: string;
}

interface JobPostRow {
    id: string;
    source_id: string;
    requisition_id: string | null;
    title: string;
    detail_path: string;
    locations: string | null;
    days_old: string | null;
    remote_type: string | null;
    created_at: string;

    detail_id: string | null;
    detail_description: string | null;
    detail_employment_type: string | null;
    detail_locations: string | null;
    detail_valid_through: string | null;
    detail_remote_type: string | null;
    detail_applicant_locations: string | null;
}

export class SqliteJobRepository implements IJobPostRepository {
    private readonly upsertJobPostStatement: Database.Statement;
    private readonly hydrateJobPostStatement: Database.Statement;
    private readonly upsertDetailStatement: Database.Statement;

    private readonly getAllStatement: Database.Statement;
    private readonly getAllCountStatement: Database.Statement;
    private readonly getByIdStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        /*
         * Discovery creates/updates the base job post.
         *
         * If detail already exists, detail-derived canonical values are
         * preserved rather than overwritten by a later discovery sync.
         *
         * Discovery locations remain independent because they are string[]
         * while detail locations are structured IJobLocation[].
         */
        this.upsertJobPostStatement = this.connection.prepare(`
            INSERT INTO job_posts (
                id,
                source_id,
                requisition_id,
                title,
                detail_path,
                locations,
                days_old,
                remote_type,
                created_at
            )
            VALUES (
                @id,
                @sourceId,
                @requisitionId,
                @title,
                @detailPath,
                @locations,
                @postedDate,
                @remoteType,
                @createdAt
            )
            ON CONFLICT(source_id, detail_path)
            DO UPDATE SET
                requisition_id = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM job_post_details
                        WHERE job_post_id = job_posts.id
                    )
                    THEN job_posts.requisition_id
                    ELSE COALESCE(excluded.requisition_id, job_posts.requisition_id)
                END,

                title = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM job_post_details
                        WHERE job_post_id = job_posts.id
                    )
                    THEN job_posts.title
                    ELSE excluded.title
                END,

                locations = excluded.locations,

                days_old = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM job_post_details
                        WHERE job_post_id = job_posts.id
                    )
                    THEN job_posts.days_old
                    ELSE COALESCE(excluded.days_old, job_posts.days_old)
                END,

                remote_type = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM job_post_details
                        WHERE job_post_id = job_posts.id
                    )
                    THEN job_posts.remote_type
                    ELSE COALESCE(excluded.remote_type, job_posts.remote_type)
                END
            RETURNING id
        `);

        /*
         * Detail hydration promotes richer detail values into the aggregate root.
         *
         * We don't duplicate these columns in job_post_details.
         */
        this.hydrateJobPostStatement = this.connection.prepare(`
            UPDATE job_posts
            SET
                requisition_id = COALESCE(@requisitionId, requisition_id),
                title = @title,
                days_old = COALESCE(@datePosted, days_old),
                remote_type = COALESCE(@remoteType, remote_type)
            WHERE id = @jobPostId
        `);

        /*
         * Store only information unique to the detailed representation.
         */
        this.upsertDetailStatement = this.connection.prepare(`
            INSERT INTO job_post_details (
                id,
                job_post_id,
                description,
                employment_type,
                locations,
                valid_through,
                remote_type,
                applicant_locations
            )
            VALUES (
                @id,
                @jobPostId,
                @description,
                @employmentType,
                @locations,
                @validThrough,
                @remoteType,
                @applicantLocations
            )
            ON CONFLICT(job_post_id)
            DO UPDATE SET
                description = excluded.description,
                employment_type = excluded.employment_type,
                locations = excluded.locations,
                valid_through = excluded.valid_through,
                remote_type = excluded.remote_type,
                applicant_locations = excluded.applicant_locations,
                fetched_at = CURRENT_TIMESTAMP
        `);

        this.getAllStatement = this.connection.prepare(`
            SELECT
                jp.id,
                jp.source_id,
                jp.requisition_id,
                jp.title,
                jp.detail_path,
                jp.locations,
                jp.days_old,
                jp.remote_type,
                jp.created_at,

                jpd.id AS detail_id,
                jpd.description AS detail_description,
                jpd.employment_type AS detail_employment_type,
                jpd.locations AS detail_locations,
                jpd.valid_through AS detail_valid_through,
                jpd.remote_type AS detail_remote_type,
                jpd.applicant_locations AS detail_applicant_locations

            FROM job_posts jp
            
            JOIN workday_job_sources c
                ON c.id = jp.source_id

            LEFT JOIN job_post_details jpd
                ON jpd.job_post_id = jp.id

                WHERE (UPPER(@companyName) = '' OR UPPER(c.company_name) LIKE '%' || UPPER(@companyName) || '%')
                    AND (UPPER(@requisitionId) = '' OR UPPER(jp.requisition_id) LIKE '%' || UPPER(@requisitionId) || '%')
                    AND (UPPER(@title) = '' OR UPPER(jp.title) LIKE '%' || UPPER(@title) || '%')
                    AND (UPPER(@location) = '' OR UPPER(jp.locations) LIKE '%' || UPPER(@location) || '%')
                    AND (COALESCE(TRIM(@daysOld), '') = '' OR UPPER(jp.days_old) LIKE '%' || UPPER(TRIM(@daysOld)) || '%')

            ORDER BY jp.created_at DESC
            LIMIT @pageCount OFFSET @offset
        `);

        this.getAllCountStatement = this.connection.prepare(`
            SELECT COUNT(*) as totalCount
            FROM job_posts jp

            JOIN workday_job_sources c
                ON c.id = jp.source_id

                WHERE (UPPER(@companyName) = '' OR UPPER(c.company_name) LIKE '%' || UPPER(@companyName) || '%')
                    AND (UPPER(@requisitionId) = '' OR UPPER(jp.requisition_id) LIKE '%' || UPPER(@requisitionId) || '%')
                    AND (UPPER(@title) = '' OR UPPER(jp.title) LIKE '%' || UPPER(@title) || '%')
                    AND (UPPER(@location) = '' OR UPPER(jp.locations) LIKE '%' || UPPER(@location) || '%')
                    AND (COALESCE(TRIM(@daysOld), '') = '' OR UPPER(jp.days_old) LIKE '%' || UPPER(TRIM(@daysOld)) || '%')
        `);

        this.getByIdStatement = this.connection.prepare(`
            SELECT
                jp.id,
                jp.source_id,
                jp.requisition_id,
                jp.title,
                jp.detail_path,
                jp.locations,
                jp.days_old,
                jp.remote_type,
                jp.created_at,

                jpd.id AS detail_id,
                jpd.description AS detail_description,
                jpd.employment_type AS detail_employment_type,
                jpd.locations AS detail_locations,
                jpd.valid_through AS detail_valid_through,
                jpd.remote_type AS detail_remote_type,
                jpd.applicant_locations AS detail_applicant_locations

            FROM job_posts jp

            LEFT JOIN job_post_details jpd
                ON jpd.job_post_id = jp.id

            WHERE jp.id = ?

            LIMIT 1
        `);
    }
    public async update(jobPost: IJobPost): Promise<void> {
        const persist = this.connection.transaction((jobPost: IJobPost) => {
            this.persist(jobPost);
        });

        persist(jobPost);

        this.logger.debug(`[SqliteJobRepository.update] Updated job post: ${jobPost.id}`);
    }

    public async add(jobPost: IJobPost): Promise<void> {
        const persist = this.connection.transaction((jobPost: IJobPost) => {
            this.persist(jobPost);
        });

        persist(jobPost);
    }

    public async addMany(jobPosts: IJobPost[]): Promise<void> {
        const persistMany = this.connection.transaction((jobPosts: IJobPost[]) => {
            for (const jobPost of jobPosts) {
                this.persist(jobPost);
            }
        });

        persistMany(jobPosts);

        this.logger.debug(`[SqliteJobRepository.addMany] Processed ${jobPosts.length} job posts`);
    }

    public async getAll(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPost[]; totalCount: number }> {
        const offset = (pageNumber - 1) * pageCount;
        const queryParams = {
            pageCount,
            offset,
            companyName: queryFilters.companyName?.trim() ?? "",
            requisitionId: queryFilters.requisitionId?.trim() ?? "",
            title: queryFilters.title?.trim() ?? "",
            location: queryFilters.location?.trim() ?? "",
            daysOld: queryFilters.daysOld?.trim() ?? "",
            jobScore: queryFilters.jobScore,
        };
        const rows = this.getAllStatement.all(queryParams) as JobPostRow[];

        const countRow = this.getAllCountStatement.get(queryParams) as { totalCount: number };
        const totalCount = countRow.totalCount;

        this.logger.debug(
            `[SqliteJobRepository.getAll] Retrieved ${rows.length} job posts (page ${pageNumber}, total: ${totalCount})`
        );

        return {
            data: rows.map(row => this.mapJobPost(row)),
            totalCount,
        };
    }

    public async getById(id: string): Promise<IJobPost | undefined> {
        const row = this.getByIdStatement.get(id) as JobPostRow | undefined;

        if (!row) {
            this.logger.debug(`[SqliteJobRepository.getById] Job post not found: ${id}`);

            return undefined;
        }

        return this.mapJobPost(row);
    }

    public async getByIdOrThrow(id: string): Promise<IJobPost> {
        const jobPost = await this.getById(id);
        if (!jobPost) {
            this.logger.error(`[SqliteJobRepository.getByIdOrThrow] Job post not found: ${id}`);
            throw new Error(`Job post not found: ${id}`);
        }
        return jobPost;
    }

    private persist(jobPost: IJobPost): string {
        /*
         * Upsert the discovery/root portion first.
         *
         * RETURNING id is important because the supplied jobPost.id may be
         * transient if this row already exists under the natural key.
         */
        const row = this.upsertJobPostStatement.get(this.mapJobPostParameters(jobPost)) as JobPostIdRow;

        const persistedJobPostId = row.id;

        if (jobPost.detail) {
            /*
             * Promote richer detail fields into the root.
             */
            this.hydrateJobPostStatement.run(this.mapHydrationParameters(persistedJobPostId, jobPost.detail));

            /*
             * Persist detail-only fields.
             */
            this.upsertDetailStatement.run(this.mapDetailParameters(persistedJobPostId, jobPost.detail));
        }

        return persistedJobPostId;
    }

    private mapJobPostParameters(jobPost: IJobPost): JobPostParameters {
        return {
            id: jobPost.id,
            sourceId: jobPost.sourceId,
            requisitionId: jobPost.requisitionId ?? null,
            title: jobPost.title,
            detailPath: jobPost.detailPath,
            locations: jobPost.locations ? JSON.stringify(jobPost.locations) : null,
            postedDate: jobPost.daysOld ?? null,
            remoteType: jobPost.remoteType ?? null,
            createdAt: jobPost.createdAt.toISOString(),
        };
    }

    private mapHydrationParameters(jobPostId: string, detail: IJobPostDetail): JobPostDetailHydrationParameters {
        return {
            jobPostId,
            requisitionId: detail.requisitionId ?? null,
            title: detail.title,
            datePosted: detail.datePosted ?? null,
            remoteType: detail.remoteType ?? null,
        };
    }

    private mapDetailParameters(jobPostId: string, detail: IJobPostDetail): JobPostDetailParameters {
        return {
            id: detail.id ?? randomUUID(),
            jobPostId,
            description: detail.description,
            employmentType: detail.employmentType ?? null,
            locations: detail.locations ? JSON.stringify(detail.locations) : null,
            validThrough: detail.validThrough ?? null,
            remoteType: detail.remoteType ?? null,
            applicantLocations: detail.applicantLocations ? JSON.stringify(detail.applicantLocations) : null,
        };
    }

    private mapJobPost(row: JobPostRow): IJobPost {
        const result = new JobPost({
            id: row.id,
            sourceId: row.source_id,
            requisitionId: row.requisition_id ?? undefined,
            title: row.title,
            detailPath: row.detail_path,
            locations: this.parseJson<string[]>(row.locations),
            daysOld: row.days_old ?? undefined,
            createdAt: new Date(row.created_at),
            remoteType: row.remote_type ?? undefined,
        });
        if (row.detail_id) {
            const detail = this.mapJobPostDetail(row);
            result.hydrateDetail(detail);
        }
        return result;
    }

    private mapJobPostDetail(row: JobPostRow): IJobPostDetail {
        return {
            id: row.detail_id ?? undefined,
            requisitionId: row.requisition_id ?? undefined,

            title: row.title,
            description: row.detail_description!,

            datePosted: row.days_old ?? undefined,
            validThrough: row.detail_valid_through ?? undefined,

            employmentType: row.detail_employment_type ?? undefined,

            locations: this.parseJson<IJobLocation[]>(row.detail_locations),

            remoteType: row.detail_remote_type ?? undefined,

            applicantLocations: this.parseJson<string[]>(row.detail_applicant_locations),
        };
    }

    private parseJson<T>(value: string | null): T | undefined {
        return value ? (JSON.parse(value) as T) : undefined;
    }
}
