import { desc, eq } from "drizzle-orm";
import { IJobApplicationRepository } from "./IJobApplicationRepository";
import { ILogger } from "../../Logging/ILogger";
import {
    ICreateJobApplication,
    IJobApplication,
    IJobApplicationAttachment,
    JobApplicationStatus,
} from "../../../Domain/JobApplications/IJobApplication";
import { NotFoundError } from "../../../Application/Common/Errors/NotFoundError";
import { jobApplications } from "../Drizzle/schema";
import type { AppDatabase } from "../SqliteDatabaseProvider";

export class JobApplicationRepository implements IJobApplicationRepository {
    constructor(
        private readonly database: AppDatabase,
        private readonly logger: ILogger
    ) {}

    public async UpdateStatus(id: string, status: JobApplicationStatus, notes: string): Promise<void> {
        this.logger.debug(
            `[JobApplicationRepository.UpdateStatus] Updating job application status for ID: ${id} to ${status}`
        );
        await this.database.update(jobApplications).set({ status, notes }).where(eq(jobApplications.id, id));
    }

    public async add(application: ICreateJobApplication): Promise<void> {
        this.logger.debug(`[JobApplicationRepository.add] Adding job application: ${application.id}`);
        await this.database.insert(jobApplications).values({
            id: application.id,
            jobPostId: application.jobId,
            status: application.status,
        });
    }

    public async getAll(): Promise<IJobApplication[]> {
        const rows = await this.database.select().from(jobApplications).orderBy(desc(jobApplications.createdAt));
        return rows.map(row => this.mapRow(row));
    }

    public async getByIdOrThrow(id: string): Promise<IJobApplication> {
        const [row] = await this.database.select().from(jobApplications).where(eq(jobApplications.id, id)).limit(1);

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
        const [row] = await this.database
            .select()
            .from(jobApplications)
            .where(eq(jobApplications.jobPostId, jobId))
            .orderBy(desc(jobApplications.createdAt), desc(jobApplications.id))
            .limit(1);

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
        await this.database.update(jobApplications).set({ attachments }).where(eq(jobApplications.id, applicationId));

        return { ...existing, attachments };
    }

    private mapRow(row: typeof jobApplications.$inferSelect): IJobApplication {
        const attachments = row.attachments.map(item => ({
            id: item.id,
            fileName: item.fileName,
            dateAdded: item.dateAdded ?? "",
        }));
        return {
            id: row.id,
            jobId: row.jobPostId,
            status: row.status,
            notes: row.notes,
            createdAt: row.createdAt,
            attachments,
        };
    }
}
