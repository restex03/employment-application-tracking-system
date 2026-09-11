import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostService, JobPostQueryFilters } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";
import { IJobPostResponse } from "./IJobPostResponse";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobRepository: IJobPostRepository,
        private readonly jobPostQueries: IJobPostQueries,
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

    public async getAll(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        const result = await this.jobPostQueries.getJobPostTableResults(pageCount, pageNumber, queryFilters);
        return result;
    }

    public async getByIdOrThrow(id: string): Promise<IJobPostResponse> {
        return await this.jobPostQueries.getJobPostTableResultByIdOrThrow(id);
    }
}
