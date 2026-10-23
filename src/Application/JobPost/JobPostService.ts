import { IJobPostService, JobPostQueryFilters } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostResponse } from "./IJobPostResponse";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobPostGateway: IJobPostGateway,
        private readonly jobPostQueries: IJobPostQueries,
        private readonly logger: ILogger
    ) {}

      public async list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        this.logger.info(`[JobPostResultTableService.list] Retrieving job posts (pageCount=${pageCount}, pageNumber=${pageNumber})`);
        const jobPosts = await this.jobPostGateway.list(pageCount, pageNumber, queryFilters);
        
        // todo: pass filters
        const assessments = await this.jobPostQueries.getJobAssessments(jobPosts.map(j => j.id));
        const applications = await this.jobPostQueries.getJobApplications(jobPosts.map(j => j.id));

        const result = {
            totalCount:jobPosts.length,
            data: jobPosts.map(x => {
                return {
                    ...x,
                    requirementMatchScore: assessments.find(a => a.jobPostId === x.id)?.requirementMatchScore ?? undefined,
                    applicationStatus: applications.find(a => a.jobPostId === x.id)?.applicationStatus ?? undefined
                } as IJobPostResponse;
            }),
        }
        return result;
    }

    public async getById(id: string): Promise<IJobPostResponse | undefined> {
        this.logger.info(`[JobPostResultTableService.getById] Retrieving job post ${id}`);
        const jobPost = await this.jobPostGateway.getById(id);
        if (!jobPost) {
            const errorMessage = `Job post not returned from API. Job Post with ID ${id} not found.`;
            this.logger.error(`[JobPostResultTableService.getById] ${errorMessage}`);
            return;
        }

        const assessment = await this.jobPostQueries.getJobAssessments([jobPost.id]);
        const application = await this.jobPostQueries.getJobApplications([jobPost.id]);

        const result = {
            ...jobPost,
            requirementMatchScore: assessment[0]?.requirementMatchScore ?? undefined,
            applicationStatus: application[0]?.applicationStatus ?? undefined,
        } as IJobPostResponse;
    
        return result;
    }
}
