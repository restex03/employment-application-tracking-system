import { ILogger } from "../../../Common/Logging/ILogger";
import { IWorkdayJobsApiResponseMapper } from "../../../../Infrastructure/APIs/ACL/Mappers/WorkdayJobsResponseMapper";
import { IJobSearchResult } from "../../../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobGateway } from "../../../../Infrastructure/APIs/JobSources/IJobSource";
import { IJobFetchService } from "../IJobFetchService";

interface IGetJobsBatchOptions {
    searchText?: string;
    limit: number;
    offset: number;
}
interface IWorkdayJobsBatchResponse {
    jobPostings: IJobSearchResult[];
    total: number;
}

export class WorkdayJobFetchService implements IJobFetchService {
    public constructor(
        private readonly jobGateway: IJobGateway,
        private readonly mapper: IWorkdayJobsApiResponseMapper,
        private readonly logger: ILogger
    ) {}
    async fetchJobs(searchText?: string): Promise<IJobSearchResult[]> {
        const jobs = new Map<string, IJobSearchResult>();
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
        const mapped = this.mapper.map(batch);
        return {
            jobPostings: mapped,
            total: batch.total,
        };
    }
}
