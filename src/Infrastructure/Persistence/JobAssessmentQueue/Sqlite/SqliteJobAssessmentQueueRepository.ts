import Database from "better-sqlite3";
import { IJobAssessmentQueueRepository } from "../IJobAssessmentQueueRepository";
import { ILogger } from "../../../Logging/ILogger";

export class SqliteJobAssessmentQueueRepository implements IJobAssessmentQueueRepository {
    private readonly claimNextQueuedJobStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.claimNextQueuedJobStatement = this.connection.prepare(`
            UPDATE job_assessment_job_queue
            SET status = 'claimed'
            WHERE id = (
                SELECT id
                FROM job_assessment_job_queue
                WHERE status = 'queued'
                ORDER BY created_at ASC
                LIMIT 1
            )
            RETURNING *
        `);
    }

    public async claimNextQueuedJob() {
        this.logger.debug("Claiming next queued job from the job assessment queue.");
        return this.claimNextQueuedJobStatement.get();
    }
}
