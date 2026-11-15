import { IJobPostService, JobPostQueryFilters } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostResponse } from "./IJobPostResponse";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobPostRepository: IJobPostRepository,
        private readonly jobPostQueries: IJobPostQueries,
        private readonly jobPostGateway: IJobPostGateway,
        private readonly logger: ILogger
    ) {}

    public async importJobPosts(fromDate: string): Promise<void> {
        const { data } = await this.jobPostGateway.listFromDate(fromDate);
        await this.jobPostRepository.upsertMany(data);
        this.logger.info(`Imported ${data.length} job posts from ${fromDate}.`);
    }

    public async list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        this.logger.info(
            `[JobPostResultTableService.list] Retrieving job posts (pageCount=${pageCount}, pageNumber=${pageNumber})`
        );
        return this.jobPostQueries.getJobPostsForClient(pageCount, pageNumber, queryFilters);
    }

    public async getById(id: string): Promise<IJobPostResponse | undefined> {
        this.logger.info(`[JobPostResultTableService.getById] Retrieving job post ${id}`);
        const jobPost = await this.jobPostRepository.getById(id);
        if (!jobPost) {
            const errorMessage = `Job post not returned from API. Job Post with ID ${id} not found.`;
            this.logger.error(`[JobPostResultTableService.getById] ${errorMessage}`);
            return;
        }

        const assessment = await this.jobPostQueries.getJobAssessments([jobPost.id], undefined);
        const application = await this.jobPostQueries.getJobApplications([jobPost.id], undefined);

        const result = {
            ...jobPost,
            requirementMatchScore: assessment[0]?.requirementMatchScore ?? undefined,
            applicationStatus: application[0]?.applicationStatus ?? undefined,
        } as IJobPostResponse;

        return result;
    }
}
