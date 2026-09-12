import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

import { ILogger } from "../../../../Logging/ILogger";

import { IJobPostSyncQueue } from "../IJobPostSyncQueue";
import { JobQueueStatus } from "../../JobQueueStatus";
import { IJobPostSyncJob, IJobPostSyncJobRequest } from "../../../../../Application/JobPostSync/Queue/IJobPostSyncJob";

interface JobPostSyncJobRow {
    id: string;
    source_ids: string;
    search_text: string;
    status: JobQueueStatus;
    error: string | null;
    warnings: string | null;
}

export class SqliteJobPostSyncQueueRepository implements IJobPostSyncQueue {
    private readonly enqueueStatement: Database.Statement;
    private readonly getJobByIdStatement: Database.Statement;
    private readonly claimNextStatement: Database.Statement;
    private readonly completeStatement: Database.Statement;
    private readonly failStatement: Database.Statement;
    private readonly findActiveJobsStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.findActiveJobsStatement = this.connection.prepare(`
            SELECT *
            FROM job_post_sync_job_queue
            WHERE status IN (@queuedStatus, @inProgressStatus)
            ORDER BY created_at ASC
        `);
        this.enqueueStatement = this.connection.prepare(`
            INSERT INTO job_post_sync_job_queue (
                id,
                source_ids,
                search_text,
                status
            )
            VALUES (
                @id,
                @sourceIds,
                @searchText,
                @status
            )
        `);

        this.getJobByIdStatement = this.connection.prepare(`
            SELECT *
            FROM job_post_sync_job_queue
            WHERE id = @jobId
        `);

        this.claimNextStatement = this.connection.prepare(`
            UPDATE job_post_sync_job_queue
            SET status = @inProgressStatus
            WHERE id = (
                SELECT id
                FROM job_post_sync_job_queue
                WHERE status = @queuedStatus
                ORDER BY created_at ASC
                LIMIT 1
            )
            AND status = @queuedStatus
            RETURNING *
        `);

        this.completeStatement = this.connection.prepare(`
            UPDATE job_post_sync_job_queue
            SET
                status = @completedStatus,
                error = NULL
            WHERE id = @jobId
              AND status = @inProgressStatus
        `);

        this.failStatement = this.connection.prepare(`
            UPDATE job_post_sync_job_queue
            SET
                status = @failedStatus,
                error = @error
            WHERE id = @jobId
              AND status = @inProgressStatus
        `);
    }
    public async getActiveJobs(): Promise<IJobPostSyncJob[]> {
        const rows = this.findActiveJobsStatement.all({
            queuedStatus: JobQueueStatus.Queued,
            inProgressStatus: JobQueueStatus.InProgress,
        }) as JobPostSyncJobRow[];

        return rows.map(row => this.mapRow(row));
    }

    public async getJobByIdOrThrow(jobId: string): Promise<IJobPostSyncJob> {
        const row = this.getJobByIdStatement.get({
            jobId,
        }) as JobPostSyncJobRow | undefined;

        if (!row) {
            throw new Error(`[SqliteJobPostSyncQueueRepository.getJobByIdOrThrow] Job not found: ${jobId}`);
        }

        return this.mapRow(row);
    }

    public async enqueue(job: IJobPostSyncJobRequest): Promise<string> {
        const id = randomUUID();

        this.enqueueStatement.run({
            id,
            sourceIds: JSON.stringify(job.sourceIds),
            searchText: job.searchText,
            status: JobQueueStatus.Queued,
        });

        this.logger.debug(`[SqliteJobPostSyncQueueRepository.enqueue] Queued job ${id}`);

        return id;
    }

    public async claimNext(): Promise<IJobPostSyncJob | null> {
        const row = this.claimNextStatement.get({
            queuedStatus: JobQueueStatus.Queued,
            inProgressStatus: JobQueueStatus.InProgress,
        }) as JobPostSyncJobRow | undefined;

        if (!row) {
            return null;
        }

        this.logger.debug(`[SqliteJobPostSyncQueueRepository.claimNext] Claimed job ${row.id}`);

        return this.mapRow(row);
    }

    public async complete(jobId: string): Promise<void> {
        const result = this.completeStatement.run({
            jobId,
            inProgressStatus: JobQueueStatus.InProgress,
            completedStatus: JobQueueStatus.Completed,
        });

        if (result.changes !== 1) {
            throw new Error(
                `[SqliteJobPostSyncQueueRepository.complete] ` + `Unable to complete in-progress job: ${jobId}`
            );
        }

        this.logger.debug(`[SqliteJobPostSyncQueueRepository.complete] Completed job ${jobId}`);
    }

    public async fail(jobId: string, error: string): Promise<void> {
        const result = this.failStatement.run({
            jobId,
            error,
            inProgressStatus: JobQueueStatus.InProgress,
            failedStatus: JobQueueStatus.Failed,
        });

        if (result.changes !== 1) {
            throw new Error(`[SqliteJobPostSyncQueueRepository.fail] ` + `Unable to fail in-progress job: ${jobId}`);
        }

        this.logger.debug(`[SqliteJobPostSyncQueueRepository.fail] Failed job ${jobId}`);
    }

    private mapRow(row: JobPostSyncJobRow): IJobPostSyncJob {
        return {
            id: row.id,
            sourceIds: JSON.parse(row.source_ids),
            searchText: row.search_text,
            status: row.status,
            error: row.error ?? undefined,
            warnings: row.warnings ? JSON.parse(row.warnings) : undefined,
        };
    }
}
