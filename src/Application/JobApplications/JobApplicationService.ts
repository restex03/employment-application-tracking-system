import { IJobApplicationService } from "./IJobApplicationService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobApplicationRepository } from "../../Infrastructure/Persistence/JobApplications/IJobApplicationRepository";
import {
    ICreateJobApplication,
    IJobApplication,
    JobApplicationStatus,
} from "../../Domain/JobApplications/IJobApplication";

export class JobApplicationService implements IJobApplicationService {
    constructor(
        private readonly jobApplicationRepository: IJobApplicationRepository,
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
}
