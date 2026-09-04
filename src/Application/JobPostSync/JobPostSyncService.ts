import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostService } from "../JobPost/IJobPostService";
import { IJobPostSyncResult, IJobPostSyncService } from "./IJobPostSyncService";
import { IJobPostDiscoveryServiceFactory } from "../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/IWorkdayJobSource";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";

export class JobPostSyncService implements IJobPostSyncService {
    constructor(
        private readonly discoveryServiceFactory: IJobPostDiscoveryServiceFactory,
        private readonly jobSourceRepository: IJobSourceRepository,
        private readonly jobPostService: IJobPostService,
        private readonly logger: ILogger
    ) {}

    public async sync(sourceId?: string): Promise<IJobPostSyncResult> {
        const sources = sourceId ? await this.getSource(sourceId) : await this.jobSourceRepository.getAll();

        let jobsDiscovered = 0;

        for (const source of sources) {
            this.logger.debug(`[JobPostSyncService.sync] Syncing source: ${source.companyName}`);

            const discoveryService = this.discoveryServiceFactory.createJobPostDiscoveryService(source);
            const discoveries = await discoveryService.fetchLookups("software engineer");

            await this.jobPostService.storeDiscoveredJobs(discoveries);

            jobsDiscovered += discoveries.length;
        }

        this.logger.debug(
            `[JobPostSyncService.sync] ` + `Processed ${sources.length} sources, ` + `discovered ${jobsDiscovered} jobs`
        );

        return {
            sourcesProcessed: sources.length,
            jobsDiscovered,
        };
    }

    private async getSource(sourceId: string): Promise<IWorkdayJobSource[]> {
        const source = await this.jobSourceRepository.getById(sourceId);

        if (!source) {
            throw new Error(`Job source not found: ${sourceId}`);
        }

        return [source];
    }
}
