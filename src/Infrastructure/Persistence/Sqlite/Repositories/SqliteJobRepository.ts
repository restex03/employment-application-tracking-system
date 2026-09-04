import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IJobPost } from "../../../../Domain/JobPosts/IJobPost";
import { IJobLocation, IJobPostDetail } from "../../../../Domain/JobPosts/IJobPostDetail";
import { ILogger } from "../../../Logging/ILogger";
import { IJobPostRepository } from "../../JobPost/IJobPostRepository";

interface JobPostParameters {
    id: string;
    sourceId: string;
    requisitionId: string | null;
    title: string;
    detailPath: string;
    locations: string | null;
    postedDate: string | null;
    createdAt: string;
}

interface JobPostDetailParameters {
    id: string;
    jobPostId: string;
    description: string;
    employmentType: string | null;
    locations: string | null;
    postedDate: string | null;
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
    posted_date: string | null;
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
    private readonly upsertDetailStatement: Database.Statement;
    private readonly getAllStatement: Database.Statement;
    private readonly getByIdStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.upsertJobPostStatement = this.connection.prepare(`
            INSERT INTO job_posts (
                id,
                source_id,
                requisition_id,
                title,
                detail_path,
                locations,
                posted_date,
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
                @createdAt
            )
            ON CONFLICT(source_id, detail_path)
            DO UPDATE SET
                requisition_id = excluded.requisition_id,
                title = excluded.title,
                locations = excluded.locations,
                posted_date = excluded.posted_date
            RETURNING id
        `);

        this.upsertDetailStatement = this.connection.prepare(`
            INSERT INTO job_post_details (
                id,
                job_post_id,
                description,
                employment_type,
                locations,
                posted_date
            )
            VALUES (
                @id,
                @jobPostId,
                @description,
                @employmentType,
                @locations,
                @postedDate
            )
            ON CONFLICT(job_post_id)
            DO UPDATE SET
                description = excluded.description,
                employment_type = excluded.employment_type,
                locations = excluded.locations,
                posted_date = excluded.posted_date,
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
                jp.posted_date,
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

            ORDER BY jp.created_at DESC
        `);

        this.getByIdStatement = this.connection.prepare(`
            SELECT
                jp.id,
                jp.source_id,
                jp.requisition_id,
                jp.title,
                jp.detail_path,
                jp.locations,
                jp.posted_date,
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

    public async add(job: IJobPost): Promise<void> {
        const persist = this.connection.transaction((job: IJobPost) => {
            this.persist(job);
        });

        persist(job);
    }

    public async addMany(jobs: IJobPost[]): Promise<void> {
        const persistMany = this.connection.transaction((jobs: IJobPost[]) => {
            for (const job of jobs) {
                this.persist(job);
            }
        });

        persistMany(jobs);

        const count = this.connection.prepare(`SELECT COUNT(*) AS count FROM job_posts`).get() as { count: number };
        this.logger.debug(
            `[SqliteJobRepository.addMany] Processed ${jobs.length} job posts. Database contains ${count.count} job posts.`
        );
    }

    public async getAll(): Promise<IJobPost[]> {
        const rows = this.getAllStatement.all() as JobPostRow[];

        this.logger.debug(`[SqliteJobRepository.getAll] Retrieved ${rows.length} job posts`);

        return rows.map(row => this.mapJobPost(row));
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
            throw new Error(`Job post not found: ${id}`);
        }
        return jobPost;
    }

    private persist(job: IJobPost): string {
        const row = this.upsertJobPostStatement.get(this.mapJobPostParameters(job)) as JobPostIdRow;

        const jobPostId = row.id;

        if (job.detail) {
            this.upsertDetailStatement.run(this.mapDetailParameters(jobPostId, job.detail));
        }

        return jobPostId;
    }

    private mapJobPostParameters(job: IJobPost): JobPostParameters {
        return {
            id: job.id,
            sourceId: job.sourceId,
            requisitionId: job.requisitionId ?? null,
            title: job.title,
            detailPath: job.detailPath,
            locations: job.locations ? JSON.stringify(job.locations) : null,
            postedDate: job.postedDate ?? null,
            createdAt: job.createdAt.toISOString(),
        };
    }

    private mapDetailParameters(jobPostId: string, detail: IJobPostDetail): JobPostDetailParameters {
        return {
            id: randomUUID(),
            jobPostId,
            description: detail.description,
            employmentType: detail.employmentType ?? null,
            locations: detail.locations ? JSON.stringify(detail.locations) : null,
            postedDate: detail.datePosted ?? null,
        };
    }

    private mapJobPost(row: JobPostRow): IJobPost {
        return {
            id: row.id,
            sourceId: row.source_id,
            requisitionId: row.requisition_id ?? undefined,
            title: row.title,
            detailPath: row.detail_path,
            locations: this.parseJson<string[]>(row.locations),
            postedDate: row.posted_date ?? undefined,
            createdAt: new Date(row.created_at),

            detail: row.detail_id ? this.mapJobPostDetail(row) : undefined,
        };
    }

    private mapJobPostDetail(row: JobPostRow): IJobPostDetail {
        return {
            id: row.detail_id ?? undefined,
            requisitionId: row.requisition_id ?? undefined,

            title: row.title,
            description: row.detail_description!,

            datePosted: row.posted_date ?? undefined,
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
