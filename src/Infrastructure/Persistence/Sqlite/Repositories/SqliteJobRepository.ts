import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IJobPost } from "../../../../Domain/JobPosts/IJobPost";
import { IJobPostDetail } from "../../../../Domain/JobPosts/IJobPostDetail";
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

export class SqliteJobRepository implements IJobPostRepository {
    private readonly upsertJobPostStatement: Database.Statement;
    private readonly upsertDetailStatement: Database.Statement;

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
}
