import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobApplicationStatus } from "../../../Domain/JobApplications/IJobApplication";
import { ILogger } from "../../Logging/ILogger";
import { SqliteDatabaseConnection } from "../JobPost/Sqlite/SqliteDatabaseConnection";
import { JobApplicationRepository } from "./JobApplicationRepository";

describe("JobApplicationRepository with a fresh database", () => {
    const logger: ILogger = {
        table: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
    let connection: SqliteDatabaseConnection;
    let repository: JobApplicationRepository;

    beforeEach(() => {
        connection = new SqliteDatabaseConnection(":memory:");
        repository = new JobApplicationRepository(connection.db, logger);
    });

    afterEach(() => {
        connection.close();
        vi.clearAllMocks();
    });

    it("creates an application with empty notes and attachments without a local job post", async () => {
        await repository.add({ id: "application-1", jobId: "post-1", status: JobApplicationStatus.Applied });

        await expect(repository.getByIdOrThrow("application-1")).resolves.toEqual({
            id: "application-1",
            jobId: "post-1",
            status: JobApplicationStatus.Applied,
            notes: "",
            attachments: [],
            createdAt: expect.any(String),
        });
        expect(connection.db.prepare("SELECT notes FROM job_applications").get()).toEqual({ notes: "" });
    });

    it("persists status and notes across all repository reads", async () => {
        await repository.add({ id: "application-1", jobId: "post-1", status: JobApplicationStatus.Applied });
        await repository.UpdateStatus("application-1", JobApplicationStatus.Interview, "Recruiter's call\nNext week");

        const reloadedRepository = new JobApplicationRepository(connection.db, logger);
        const application = await reloadedRepository.getByIdOrThrow("application-1");
        expect(application.status).toBe(JobApplicationStatus.Interview);
        expect(application.notes).toBe("Recruiter's call\nNext week");
        await expect(reloadedRepository.getByJobId("post-1")).resolves.toEqual(application);
        await expect(reloadedRepository.getAll()).resolves.toEqual([application]);

        await reloadedRepository.UpdateStatus("application-1", JobApplicationStatus.Offer, "");
        await expect(reloadedRepository.getByIdOrThrow("application-1")).resolves.toMatchObject({
            status: JobApplicationStatus.Offer,
            notes: "",
        });
    });

    it("preserves attachments when notes change and notes when attachments change", async () => {
        await repository.add({ id: "application-1", jobId: "post-1", status: JobApplicationStatus.Applied });
        const attachment = { id: "attachment-1", fileName: "resume.pdf", dateAdded: "2026-10-23" };
        await repository.addAttachment("application-1", attachment);
        await repository.UpdateStatus("application-1", JobApplicationStatus.Interview, "Follow up");
        const secondAttachment = { id: "attachment-2", fileName: "cover-letter.pdf", dateAdded: "2026-10-23" };
        await repository.addAttachment("application-1", secondAttachment);

        await expect(repository.getByIdOrThrow("application-1")).resolves.toMatchObject({
            status: JobApplicationStatus.Interview,
            notes: "Follow up",
            attachments: [attachment, secondAttachment],
        });
    });
});
