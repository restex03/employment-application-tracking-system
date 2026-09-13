import Database from "better-sqlite3";
import { IJobApplicationRepository } from "./IJobApplicationRepository";
import { ILogger } from "../../Logging/ILogger";
import {
    ICreateJobApplication,
    IJobApplication,
    IJobApplicationAttachment,
    JobApplicationStatus,
} from "../../../Domain/JobApplications/IJobApplication";
import { NotFoundError } from "../../../Application/Common/Errors/NotFoundError";

interface JobApplicationRow {
    id: string;
    job_post_id: string;
    status: string;
    created_at: string;
    attachments: string | null;
}

export class JobApplicationRepository implements IJobApplicationRepository {
    private readonly insertStatement: Database.Statement;
    private readonly getAllStatement: Database.Statement;
    private readonly getByIdStatement: Database.Statement;
    private readonly getByJobIdStatement: Database.Statement;
    private readonly updateStatusStatement: Database.Statement;
    private readonly updateAttachmentsStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.insertStatement = connection.prepare(`
            INSERT INTO job_applications (id, job_post_id, status)
            VALUES (@id, @jobId, @status)
        `);

        this.getAllStatement = connection.prepare(`
            SELECT * FROM job_applications ORDER BY created_at DESC
        `);

        this.getByIdStatement = connection.prepare(`
            SELECT * FROM job_applications WHERE id = @id
        `);

        this.getByJobIdStatement = connection.prepare(`
            SELECT * FROM job_applications WHERE job_post_id = @jobId LIMIT 1
        `);

        this.updateStatusStatement = connection.prepare(`
            UPDATE job_applications SET status = @status WHERE id = @id
        `);

        this.updateAttachmentsStatement = connection.prepare(`
            UPDATE job_applications SET attachments = @attachments WHERE id = @id
        `);
    }
    public async UpdateStatus(id: string, status: JobApplicationStatus): Promise<void> {
        this.logger.debug(
            `[JobApplicationRepository.UpdateStatus] Updating job application status for ID: ${id} to ${status}`
        );
        this.updateStatusStatement.run({
            id,
            status: status.toString(),
        });
    }

    public async add(application: ICreateJobApplication): Promise<void> {
        this.logger.debug(`[JobApplicationRepository.add] Adding job application: ${application.id}`);
        this.insertStatement.run({
            id: application.id,
            jobId: application.jobId,
            status: application.status.toString(),
        });
    }

    public async getAll(): Promise<IJobApplication[]> {
        const rows = this.getAllStatement.all() as JobApplicationRow[];
        return rows.map(row => this.mapRow(row));
    }

    public async getByIdOrThrow(id: string): Promise<IJobApplication> {
        const row = this.getByIdStatement.get({ id }) as JobApplicationRow | undefined;

        if (!row) {
            this.logger.error(`[JobApplicationRepository.getByIdOrThrow] Job application not found: ${id}`);
            throw new NotFoundError(
                `[JobApplicationRepository.getByIdOrThrow] Job application with ID ${id} does not exist.`,
                "id"
            );
        }

        return this.mapRow(row);
    }

    public async getByJobId(jobId: string): Promise<IJobApplication | null> {
        const row = this.getByJobIdStatement.get({ jobId }) as JobApplicationRow | undefined;

        if (!row) {
            return null;
        }

        return this.mapRow(row);
    }

    public async addAttachment(applicationId: string, attachment: IJobApplicationAttachment): Promise<IJobApplication> {
        const existing = await this.getByIdOrThrow(applicationId);
        const attachments = [...existing.attachments, attachment];

        this.logger.debug(
            `[JobApplicationRepository.addAttachment] Adding attachment ${attachment.id} to application ${applicationId}`
        );
        this.updateAttachmentsStatement.run({
            id: applicationId,
            attachments: JSON.stringify(attachments),
        });

        return { ...existing, attachments };
    }

    private mapRow(row: JobApplicationRow): IJobApplication {
        return {
            id: row.id,
            jobId: row.job_post_id,
            // row.status already stores the enum's string value (e.g. "APPLIED"), not its key.
            status: row.status as JobApplicationStatus,
            createdAt: row.created_at,
            attachments: row.attachments ? (JSON.parse(row.attachments) as IJobApplicationAttachment[]) : [],
        };
    }
}
