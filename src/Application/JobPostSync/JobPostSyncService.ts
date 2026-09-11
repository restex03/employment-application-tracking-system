import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostService } from "../JobPost/IJobPostService";
import { IJobPostSyncResult, IJobPostSyncService } from "./IJobPostSyncService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { IJobSource } from "../../Domain/JobSources/IJobSource";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";
import { randomUUID } from "crypto";
import { IJobPost, JobPost } from "../../Domain/JobPosts/IJobPost";

export class JobPostSyncService implements IJobPostSyncService {
    constructor(
        private readonly discoveryServiceFactory: IJobPostDiscoveryServiceFactory,
        private readonly jobSourceRepository: IJobSourceRepository,
        private readonly jobPostService: IJobPostService,
        private readonly logger: ILogger
    ) {}

    public async syncJobs(sourceIds: string[], searchText?: string): Promise<IJobPostSyncResult> {
        const sourcePromises = sourceIds.map(async x => this.getSource(x));
        const sources = await Promise.all(sourcePromises);
        let jobsDiscovered = 0;

        for (const source of sources) {
            this.logger.debug(`[JobPostSyncService.sync] Syncing source: ${source.companyName}`);

            // TODO: Incorporate batching
            const discoveryService = this.discoveryServiceFactory.create(source);
            const discoveries = await discoveryService.fetchList(searchText);
            const jobPosts = discoveries.map(discovery => this.createJobPost(discovery));
            await this.jobPostService.addMany(jobPosts);

            jobsDiscovered += jobPosts.length;
        }

        this.logger.debug(
            `[JobPostSyncService.sync] ` + `Processed ${sources.length} sources, ` + `discovered ${jobsDiscovered} jobs`
        );

        return {
            sourcesProcessed: sources.length,
            jobsDiscovered,
        };
    }

    public async syncJobDetails(jobPostId: string): Promise<void> {
        this.logger.debug(`[JobPostSyncService.sync] Syncing job details for job post: ${jobPostId}`);
        const jobPost = await this.jobPostService.getByIdOrThrow(jobPostId);
        const source = await this.getSource(jobPost.sourceId);
        const discoveryService = this.discoveryServiceFactory.create(source);
        const detail = await discoveryService.fetchDetail(jobPost);
        jobPost.hydrateDetail(detail);
        await this.jobPostService.update(jobPost);
    }

    private async getSource(sourceId: string): Promise<IJobSource> {
        const source = await this.jobSourceRepository.getById(sourceId);

        if (!source) {
            throw new Error(`Job source not found: ${sourceId}`);
        }

        return source;
    }

    private createJobPost(disco: IJobPostDiscovery): IJobPost {
        const result = new JobPost({
            id: randomUUID(),
            sourceId: disco.sourceId,
            requisitionId: disco.requisitionId,
            title: disco.title,
            detailPath: disco.detailPath,
            locations: disco.locations,
            daysOld: disco.daysOld,
            createdAt: new Date(),
            remoteType: disco.remoteType,
        });

        return result;
    }
}
