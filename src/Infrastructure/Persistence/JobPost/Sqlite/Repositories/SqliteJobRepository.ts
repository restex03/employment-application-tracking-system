import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IJobPost } from "../../../../../Domain/JobPosts/IJobPost";
import { IJobPostDetail } from "../../../../../Domain/JobPosts/IJobPostDetail";
import { IJobRepository } from "../../IJobPostRepository";
import { ILogger } from "../../../../Logging/ILogger";

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

export class SqliteJobRepository implements IJobRepository {
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

        const count = this.connection.prepare(`SELECT COUNT(*) AS count FROM job_posts`).get() as { count: number };
        this.logger.debug(
            `[SqliteJobRepository.addMany] Processed ${jobPosts.length} job posts. Database contains ${count.count} job posts.`
        );
    }

    private persist(jobPost: IJobPost): string {
        const row = this.upsertJobPostStatement.get(this.mapJobPostParameters(jobPost)) as JobPostIdRow;

        const jobPostId = row.id;

        if (jobPost.detail) {
            this.upsertDetailStatement.run(this.mapDetailParameters(jobPostId, jobPost.detail));
        }

        return jobPostId;
    }

    private mapJobPostParameters(jobPost: IJobPost): JobPostParameters {
        return {
            id: jobPost.id,
            sourceId: jobPost.sourceId,
            requisitionId: jobPost.requisitionId ?? null,
            title: jobPost.title,
            detailPath: jobPost.detailPath,
            locations: jobPost.locations ? JSON.stringify(jobPost.locations) : null,
            postedDate: jobPost.postedDate ?? null,
            createdAt: jobPost.createdAt.toISOString(),
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
