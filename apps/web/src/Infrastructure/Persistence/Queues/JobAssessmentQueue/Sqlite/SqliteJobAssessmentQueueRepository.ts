import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import {
    IJobAssessmentJob,
    IJobAssessmentJobRequest,
} from "../../../../../Application/JobAssessment/PipelineQueue/IJobAssessmentJob";
import { ILogger } from "../../../../Logging/ILogger";
import { JobQueueStatus } from "../../JobQueueStatus";
import { IJobAssessmentQueue } from "../IJobAssessmentQueue";

interface JobAssessmentJobRow {
    id: string;
    job_post_id: string;
    candidate_profile_id: string;
    status: JobQueueStatus;
    error: string | null;
    warnings: string | null;
}

interface JobAssessmentJobStatusRow {
    status: JobQueueStatus;
}

export class SqliteJobAssessmentQueueRepository implements IJobAssessmentQueue {
    private readonly enqueueStatement: Database.Statement;
    private readonly getJobById: Database.Statement;
    private readonly claimNextStatement: Database.Statement;
    private readonly completeStatement: Database.Statement;
    private readonly failStatement: Database.Statement;
    private readonly findActiveJobByIdStatement: Database.Statement;
    private readonly findActiveJobsStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.findActiveJobByIdStatement = this.connection.prepare(`
            SELECT id
            FROM job_assessment_job_queue
            WHERE job_post_id = @jobPostId
            AND candidate_profile_id = @candidateProfileId
            AND status IN (@queuedStatus, @inProgressStatus)
            ORDER BY created_at ASC
            LIMIT 1
        `);
        this.findActiveJobsStatement = this.connection.prepare(`
            SELECT *
            FROM job_assessment_job_queue
            WHERE status IN (@queuedStatus, @inProgressStatus)
            ORDER BY created_at ASC
        `);
        this.enqueueStatement = this.connection.prepare(`
            INSERT INTO job_assessment_job_queue (
                id,
                job_post_id,
                candidate_profile_id,
                status
            )
            VALUES (
                @id,
                @jobPostId,
                @candidateProfileId,
                @status
            )
        `);

        this.getJobById = this.connection.prepare(`
            SELECT *
            FROM job_assessment_job_queue
            WHERE id = @jobId
        `);

        this.claimNextStatement = this.connection.prepare(`
            UPDATE job_assessment_job_queue
            SET status = @inProgressStatus
            WHERE id = (
                SELECT id
                FROM job_assessment_job_queue
                WHERE status = @queuedStatus
                ORDER BY created_at ASC
                LIMIT 1
            )
            AND status = @queuedStatus
            RETURNING *
        `);

        this.completeStatement = this.connection.prepare(`
            UPDATE job_assessment_job_queue
            SET
                status = @completedStatus,
                error = NULL
            WHERE id = @jobId
              AND status = @inProgressStatus
        `);

        this.failStatement = this.connection.prepare(`
            UPDATE job_assessment_job_queue
            SET
                status = @failedStatus,
                error = @error
            WHERE id = @jobId
              AND status = @inProgressStatus
        `);
    }
    public async getActiveJobs(): Promise<IJobAssessmentJob[]> {
        const rows = this.findActiveJobsStatement.all({
            queuedStatus: JobQueueStatus.Queued,
            inProgressStatus: JobQueueStatus.InProgress,
        }) as JobAssessmentJobRow[];

        return rows.map(row => this.mapRow(row));
    }

    public async getJobByIdOrThrow(jobId: string): Promise<IJobAssessmentJob> {
        const row = this.getJobById.get({
            jobId,
        }) as JobAssessmentJobRow | undefined;

        if (!row) {
            throw new Error(`Job with ID ${jobId} not found`);
        }

        return this.mapRow(row);
    }

    public async enqueue(job: IJobAssessmentJobRequest): Promise<string> {
        const existingJob = this.findActiveJobByIdStatement.get({
            jobPostId: job.jobPostId,
            candidateProfileId: job.candidateProfileId,
            queuedStatus: JobQueueStatus.Queued,
            inProgressStatus: JobQueueStatus.InProgress,
        }) as { id: string } | undefined;

        if (existingJob) {
            this.logger.debug(
                `[SqliteJobAssessmentQueueRepository.enqueue] ` + `Active job already exists: ${existingJob.id}`
            );

            return existingJob.id;
        }

        const id = randomUUID();

        this.enqueueStatement.run({
            id,
            jobPostId: job.jobPostId,
            candidateProfileId: job.candidateProfileId,
            status: JobQueueStatus.Queued,
        });

        this.logger.debug(`[SqliteJobAssessmentQueueRepository.enqueue] Queued job ${id}`);

        return id;
    }

    public async claimNext(): Promise<IJobAssessmentJob | null> {
        const row = this.claimNextStatement.get({
            queuedStatus: JobQueueStatus.Queued,
            inProgressStatus: JobQueueStatus.InProgress,
        }) as JobAssessmentJobRow | undefined;

        if (!row) {
            return null;
        }

        this.logger.debug(`[SqliteJobAssessmentQueueRepository.claimNext] Claimed job ${row.id}`);

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
                `[SqliteJobAssessmentQueueRepository.complete] ` + `Unable to complete in-progress job: ${jobId}`
            );
        }

        this.logger.debug(`[SqliteJobAssessmentQueueRepository.complete] Completed job ${jobId}`);
    }

    public async fail(jobId: string, error: string): Promise<void> {
        const result = this.failStatement.run({
            jobId,
            error,
            inProgressStatus: JobQueueStatus.InProgress,
            failedStatus: JobQueueStatus.Failed,
        });

        if (result.changes !== 1) {
            throw new Error(`[SqliteJobAssessmentQueueRepository.fail] ` + `Unable to fail in-progress job: ${jobId}`);
        }

        this.logger.debug(`[SqliteJobAssessmentQueueRepository.fail] Failed job ${jobId}`);
    }

    private mapRow(row: JobAssessmentJobRow): IJobAssessmentJob {
        return {
            id: row.id,
            jobPostId: row.job_post_id,
            candidateProfileId: row.candidate_profile_id,
            status: row.status,
            error: row.error ?? undefined,
            warnings: row.warnings ? JSON.parse(row.warnings) : undefined,
        };
    }
}
