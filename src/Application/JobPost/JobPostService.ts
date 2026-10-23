import { IJobPostService, JobPostQueryFilters } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostResponse } from "./IJobPostResponse";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobPostGateway: IJobPostGateway,
        private readonly logger: ILogger
    ) {}

      public async list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        this.logger.info(`[JobPostResultTableService.list] Retrieving job posts (pageCount=${pageCount}, pageNumber=${pageNumber})`);
        const result = await this.jobPostGateway.list(pageCount, pageNumber, queryFilters);
        return result;
    }

    public async getById(id: string): Promise<IJobPostResponse | undefined> {
        this.logger.info(`[JobPostResultTableService.getById] Retrieving job post ${id}`);
        const result = await this.jobPostGateway.getJobPost(id);
        if (!result) {
            const errorMessage = `Job post not returned from API. Job Post with ID ${id} not found.`;
            this.logger.error(`[JobPostResultTableService.getById] ${errorMessage}`);
        }
        return result;
    }
}
