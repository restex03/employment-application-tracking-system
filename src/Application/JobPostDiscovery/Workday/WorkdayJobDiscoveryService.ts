import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";
import { IJobGateway } from "../../../Domain/JobPosts/IJobSource";
import { IWorkdayJobDetailsApiResponseMapper } from "../../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobDetailsApiResponseMapper";
import { IWorkdayJobsApiResponseMapper } from "../../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobsApiResponseMapper";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobPostDiscoveryService } from "../IJobPostDiscoveryService";

interface IGetJobsBatchOptions {
    searchText?: string;
    limit: number;
    offset: number;
}
interface IWorkdayJobsBatchResponse {
    jobPostings: IJobPostDiscovery[];
    total: number;
}

interface WorkdayJobDiscoveryServiceOptions {
    readonly lookupMapper: IWorkdayJobsApiResponseMapper;
    readonly detailMapper: IWorkdayJobDetailsApiResponseMapper;
    readonly jobGateway: IJobGateway;
    readonly logger: ILogger;
}

export class WorkdayJobDiscoveryService implements IJobPostDiscoveryService {
    private readonly lookupMapper: IWorkdayJobsApiResponseMapper;
    private readonly detailMapper: IWorkdayJobDetailsApiResponseMapper;
    private readonly jobGateway: IJobGateway;
    private readonly logger: ILogger;

    public constructor(opts: WorkdayJobDiscoveryServiceOptions) {
        this.lookupMapper = opts.lookupMapper;
        this.detailMapper = opts.detailMapper;
        this.jobGateway = opts.jobGateway;
        this.logger = opts.logger;
    }
    async fetchLookups(searchText?: string): Promise<IJobPostDiscovery[]> {
        this.logger.info(`[WorkdayJobDiscoveryService.fetchJobs] Fetching jobs...`);
        const jobs = new Map<string, IJobPostDiscovery>();
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
                this.logger.info(`[WorkdayJobDiscoveryService.fetchJobs] Total jobs to fetch: ${total}`);
            }

            for (const job of response.jobPostings) {
                jobs.set(job.detailPath, job);
            }

            offset += limit;
        } while (offset < total);

        return [...jobs.values()];
    }

    async fetchDetail(lookup: IJobPostDiscovery): Promise<IJobPostDetail> {
        this.logger.info(
            `[WorkdayJobDiscoveryService.fetchJobDetail] Fetching details: ${lookup.requisitionId} (${lookup.title})`
        );
        const apiResult = await this.jobGateway.getDetail(lookup.detailPath);
        const jobDetail = this.detailMapper.map(apiResult);
        const locations =
            jobDetail.locations
                ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
                .join("\n") ?? "\t- None";

        this.logger.info(`\t- Title: ${jobDetail.title}`);
        this.logger.info(`\t- Requisition ID: ${jobDetail.requisitionId ?? "Unknown"}`);
        this.logger.info(`\t- Locations (${jobDetail.locations?.length ?? 0}):\n${locations}`);
        this.logger.info(`\t- Description: ${jobDetail.description.slice(0, 150)}...\n`);

        return jobDetail;
    }

    /** @deprecated use fetchDetail instead */
    async fetchDetails(lookups: IJobPostDiscovery[]): Promise<IJobPostDetail[]> {
        this.logger.info(`[WorkdayJobDiscoveryService.fetchJobDetails] Fetching details: ${lookups.length} jobs.`);
        const jobDetailsList: IJobPostDetail[] = [];

        for (const result of lookups) {
            const jobDetail = await this.fetchDetail(result);
            jobDetailsList.push(jobDetail);
        }

        return jobDetailsList;
    }

    async getJobsBatch(opts: IGetJobsBatchOptions): Promise<IWorkdayJobsBatchResponse> {
        const request = {
            appliedFacets: {},
            limit: opts.limit,
            offset: opts.offset,
            searchText: opts.searchText ?? "",
        };

        const batch = await this.jobGateway.search(request);
        this.logger.trace(
            `[WorkdayJobDiscoveryService.getJobsBatch] Batch retrieved: ${batch.jobPostings.length} jobs`
        );
        const mapped = batch.jobPostings.map(x => this.lookupMapper.map(x));
        return {
            jobPostings: mapped,
            total: batch.total,
        };
    }
}
