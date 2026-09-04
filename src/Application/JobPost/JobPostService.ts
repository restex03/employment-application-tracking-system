import { randomUUID } from "node:crypto";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostDiscovery } from "../../Domain/JobPosts/IJobPostDiscovery";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostService } from "./IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobRepository: IJobPostRepository,
        private readonly logger: ILogger
    ) {}

    public async storeDiscoveredJobs(discoveries: IJobPostDiscovery[]): Promise<void> {
        this.logger.info(`[JobPostService.storeDiscoveredJobs] Storing ${discoveries.length} discovered jobs...`);
        const jobs = discoveries.map(discovery => this.createJobPost(discovery));

        await this.jobRepository.addMany(jobs);
    }

    private createJobPost(discovery: IJobPostDiscovery): IJobPost {
        return {
            id: randomUUID(),
            sourceId: discovery.sourceId,
            requisitionId: discovery.requisitionId,
            title: discovery.title,
            detailPath: discovery.detailPath,
            locations: discovery.locations,
            postedDate: discovery.postedDate,
            createdAt: new Date(),
        };
    }
}
