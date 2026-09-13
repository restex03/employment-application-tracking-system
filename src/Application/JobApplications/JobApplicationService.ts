import { IJobApplicationService } from "./IJobApplicationService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobApplicationRepository } from "../../Infrastructure/Persistence/JobApplications/IJobApplicationRepository";
import { IFileSystemRepository } from "../../Infrastructure/Persistence/FileSystem/IFileSystemRepository";
import { NotFoundError } from "../Common/Errors/NotFoundError";
import {
    ICreateJobApplication,
    IJobApplication,
    IJobApplicationAttachment,
    JobApplicationStatus,
} from "../../Domain/JobApplications/IJobApplication";

export class JobApplicationService implements IJobApplicationService {
    constructor(
        private readonly jobApplicationRepository: IJobApplicationRepository,
        private readonly fileSystemRepository: IFileSystemRepository,
        private readonly logger: ILogger
    ) {}
    public async UpdateStatus(id: string, status: JobApplicationStatus): Promise<void> {
        this.logger.info(
            `[JobApplicationService.UpdateStatus] Updating job application status for ID: ${id} to ${status}`
        );
        await this.jobApplicationRepository.getByIdOrThrow(id);
        await this.jobApplicationRepository.UpdateStatus(id, status);
    }
    public async add(jobId: string): Promise<void> {
        this.logger.info(`[JobApplicationService.add] Adding job application`);
        const jobApplication: ICreateJobApplication = {
            id: crypto.randomUUID(),
            jobId,
            status: JobApplicationStatus.Applied,
        };
        return this.jobApplicationRepository.add(jobApplication);
    }
    public async getAll(): Promise<IJobApplication[]> {
        this.logger.info(`[JobApplicationService.getAll] Getting all job applications`);
        return this.jobApplicationRepository.getAll();
    }

    public async getByIdOrThrow(id: string): Promise<IJobApplication> {
        this.logger.info(`[JobApplicationService.getByIdOrThrow] Getting job application by ID: ${id}`);
        return this.jobApplicationRepository.getByIdOrThrow(id);
    }

    public async getByJobId(jobId: string): Promise<IJobApplication | undefined> {
        this.logger.info(`[JobApplicationService.getByJobId] Getting job application by job ID: ${jobId}`);
        const result = await this.jobApplicationRepository.getByJobId(jobId);
        return result ?? undefined;
    }

    public async addAttachment(
        applicationId: string,
        fileName: string,
        content: Buffer
    ): Promise<IJobApplicationAttachment> {
        this.logger.info(`[JobApplicationService.addAttachment] Adding attachment to application: ${applicationId}`);
        await this.jobApplicationRepository.getByIdOrThrow(applicationId);

        const attachment: IJobApplicationAttachment = {
            id: crypto.randomUUID(),
            fileName,
        };

        await this.fileSystemRepository.storeFile(attachment.id, content);
        await this.jobApplicationRepository.addAttachment(applicationId, attachment);

        return attachment;
    }

    public async getAttachment(
        applicationId: string,
        attachmentId: string
    ): Promise<{ fileName: string; content: Buffer }> {
        this.logger.info(
            `[JobApplicationService.getAttachment] Getting attachment ${attachmentId} for application: ${applicationId}`
        );
        const application = await this.jobApplicationRepository.getByIdOrThrow(applicationId);
        const attachment = application.attachments.find(existing => existing.id === attachmentId);

        if (!attachment) {
            throw new NotFoundError(
                `[JobApplicationService.getAttachment] Attachment ${attachmentId} not found for application ${applicationId}.`,
                "attachmentId"
            );
        }

        const content = await this.fileSystemRepository.readFile(attachment.id);
        return { fileName: attachment.fileName, content };
    }
}
