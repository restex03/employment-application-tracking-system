import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostSyncResult, IJobPostSyncService } from "./IJobPostSyncService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { IJobSource } from "../../Domain/JobSources/IJobSource";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";
import { randomUUID } from "crypto";
import { IJobPost, JobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";

export class JobPostSyncService implements IJobPostSyncService {
    constructor(
        private readonly discoveryServiceFactory: IJobPostDiscoveryServiceFactory,
        private readonly jobSourceRepository: IJobSourceRepository,
        private readonly jobPostRepository: IJobPostRepository,
        private readonly logger: ILogger
    ) {}

    public async syncJobs(sourceIds: string[], searchText?: string): Promise<void> {
        const sourcePromises = sourceIds.map(async x => this.getSource(x));
        const sources = await Promise.all(sourcePromises);
        let numSourcesSynced = 0;
        let numJobsDiscovered = 0;
        for (const source of sources) {
            try {
                this.logger.debug(`[JobPostSyncService.sync] Syncing source: ${source.companyName}`);

                // TODO: Incorporate batching
                const discoveryService = this.discoveryServiceFactory.create(source);
                const discoveries = await discoveryService.fetchList(searchText);
                const jobPosts = discoveries.map(discovery => this.createJobPost(discovery));
                await this.jobPostRepository.addMany(jobPosts);
                numSourcesSynced++;
                numJobsDiscovered += jobPosts.length;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[JobPostSyncService.sync] Failed to sync source ${source.companyName}: ${errMsg}`);
            }
        }
        this.logger.debug(
            `[JobPostSyncService.sync] Synced ${numSourcesSynced} sources and discovered ${numJobsDiscovered} jobs.`
        );
        this.logger.debug(`[JobPostSyncService.sync] Completed syncing all sources.`);
    }

    public async syncJobDetails(jobPostId: string): Promise<void> {
        this.logger.debug(`[JobPostSyncService.sync] Syncing job details for job post: ${jobPostId}`);
        const jobPost = await this.jobPostRepository.getByIdOrThrow(jobPostId);
        const source = await this.getSource(jobPost.sourceId);
        const discoveryService = this.discoveryServiceFactory.create(source);
        const detail = await discoveryService.fetchDetail(jobPost);
        jobPost.hydrateDetail(detail);
        await this.jobPostRepository.update(jobPost);
    }

    public async update(job: IJobPost): Promise<void> {
        this.logger.info(`[JobPostSyncService.update] ` + `Updating job ${job.id}...`);
        await this.jobPostRepository.update(job);
    }

    public async addMany(jobs: IJobPost[]): Promise<void> {
        this.logger.info(`[JobPostSyncService.addMany] ` + `Storing ${jobs.length} jobs...`);

        await this.jobPostRepository.addMany(jobs);
    }

    public async getByIdOrThrow(id: string): Promise<IJobPost> {
        return await this.jobPostRepository.getByIdOrThrow(id);
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
