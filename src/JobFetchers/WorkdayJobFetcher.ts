import { ILogger } from "../Application/Common/Logger/ILogger";
import { IWorkdayJobsApiResponseMapper } from "../Infrastructure/APIs/ACL/Mappers/WorkdayJobsResponseMapper";
import { IJobSearchResult } from "../Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobGateway } from "../Infrastructure/APIs/JobSources/IJobSource";
import { IJobFetcher } from "./IJobFetcher";

interface IGetJobsBatchOptions {
    limit: number;
    offset: number;
}
interface IWorkdayJobsBatchResponse {
    jobPostings: IJobSearchResult[];
    total: number;
}

export class WorkdayJobFetcher implements IJobFetcher {
    public constructor(
        private readonly jobGateway: IJobGateway,
        private readonly mapper: IWorkdayJobsApiResponseMapper,
        private readonly logger: ILogger
    ) {}
    async fetchJobs(): Promise<IJobSearchResult[]> {
        const jobs = new Map<string, IJobSearchResult>();
        let offset = 0;
        const limit = 20;
        let total: number | undefined = undefined;
        do {
            const response = await this.getJobsBatch({
                limit,
                offset,
            });

            if (total === undefined) {
                total = response.total;
                this.logger.debug(`[WorkdayJobFetcher.fetchJobs] Total jobs to fetch: ${total}`);
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
            searchText: "",
        };

        const batch = await this.jobGateway.search(request);

        this.logger.debug(`[WorkdayJobFetcher.getJobsBatch] Batch retrieved: ${batch.jobPostings.length} jobs`);
        const mapped = this.mapper.map(batch);
        return {
            jobPostings: mapped,
            total: batch.total,
        };
    }
}
