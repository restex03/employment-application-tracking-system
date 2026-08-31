import { IJobPostLookup } from "../../../../Domain/JobPosts/IJobPostLookup";
import { IJobGateway } from "../../../../Domain/JobPosts/IJobSource";
import { IWorkdayJobsApiResponseMapper } from "../../../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobsApiResponseMapper";
import { ILogger } from "../../../Common/Logging/ILogger";
import { IJobFetchService } from "../IJobFetchService";

interface IGetJobsBatchOptions {
    searchText?: string;
    limit: number;
    offset: number;
}
interface IWorkdayJobsBatchResponse {
    jobPostings: IJobPostLookup[];
    total: number;
}

export class WorkdayJobFetchService implements IJobFetchService {
    public constructor(
        private readonly jobGateway: IJobGateway,
        private readonly mapper: IWorkdayJobsApiResponseMapper,
        private readonly logger: ILogger
    ) {}
    async fetchJobs(searchText?: string): Promise<IJobPostLookup[]> {
        this.logger.info(`[WorkdayJobFetchService.fetchJobs] Fetching jobs...`);
        const jobs = new Map<string, IJobPostLookup>();
        let offset = 0;
        const limit = 20;
        let total: number | undefined = undefined;
        do {
            const response = await this.getJobsBatch({
                limit,
                offset,
                searchText,
            });

            if (total === undefined) {
                total = response.total;
                this.logger.info(`[WorkdayJobFetchService.fetchJobs] Total jobs to fetch: ${total}`);
            }

            for (const job of response.jobPostings) {
                jobs.set(job.detailPath, job);
            }

            offset += limit;
        } while (offset < total);

        return [...jobs.values()];
    }
    async getJobsBatch(opts: IGetJobsBatchOptions): Promise<IWorkdayJobsBatchResponse> {
        const request = {
            appliedFacets: {},
            limit: opts.limit,
            offset: opts.offset,
            searchText: opts.searchText ?? "",
        };

        const batch = await this.jobGateway.search(request);

        this.logger.trace(`[WorkdayJobFetchService.getJobsBatch] Batch retrieved: ${batch.jobPostings.length} jobs`);
        const mapped = batch.jobPostings.map(x => this.mapper.map(x));
        return {
            jobPostings: mapped,
            total: batch.total,
        };
    }
}
