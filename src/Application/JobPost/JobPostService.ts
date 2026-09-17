import { IJobPostService } from "./IJobPostService";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { ILogger } from "../../Infrastructure/Logging/ILogger";

export class JobPostService implements IJobPostService {
    constructor(
        private readonly jobPostRepository: IJobPostRepository,
        private readonly logger: ILogger
    ) {}

    public async setDismissed(id: string, dismissed: boolean): Promise<void> {
        this.logger.info(`[JobPostResultService.setDismissed] Setting dismissed=${dismissed} for job post ${id}`);
        await this.jobPostRepository.setDismissed(id, dismissed);
    }
}
