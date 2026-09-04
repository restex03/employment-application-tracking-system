import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostService } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobRepository: IJobPostRepository,
        private readonly logger: ILogger
    ) {}

    public async addMany(jobs: IJobPost[]): Promise<void> {
        this.logger.info(`[JobPostService.addMany] ` + `Storing ${jobs.length} jobs...`);

        await this.jobRepository.addMany(jobs);
    }

    public async getAll(): Promise<IJobPost[]> {
        return this.jobRepository.getAll();
    }

    public async getById(id: string): Promise<IJobPost | undefined> {
        return this.jobRepository.getById(id);
    }
}
