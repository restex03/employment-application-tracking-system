import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostService } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobRepository: IJobPostRepository,
        private readonly logger: ILogger
    ) {}
    public async update(job: IJobPost): Promise<void> {
        this.logger.info(`[JobPostService.update] ` + `Updating job ${job.id}...`);
        await this.jobRepository.update(job);
    }

    public async addMany(jobs: IJobPost[]): Promise<void> {
        this.logger.info(`[JobPostService.addMany] ` + `Storing ${jobs.length} jobs...`);

        await this.jobRepository.addMany(jobs);
    }

    public async getAll(pageCount: number, pageNumber: number): Promise<{ data: IJobPost[]; totalCount: number }> {
        return this.jobRepository.getAll(pageCount, pageNumber);
    }

    public async getById(id: string): Promise<IJobPost | undefined> {
        return this.jobRepository.getById(id);
    }
    public async getByIdOrThrow(id: string): Promise<IJobPost> {
        return this.jobRepository.getByIdOrThrow(id);
    }
}
