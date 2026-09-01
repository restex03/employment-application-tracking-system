import { IJobPostLookup } from "../../../../Domain/JobPosts/IJobPostLookup";
import { IJobScreenEvaluator } from "../IJobScreenEvaluator";
import { IJobScreenResult } from "../IJobScreenResult";
import { ILogger } from "../../../../Infrastructure/Logging/ILogger";
import { IJobScreeningService } from "../IJobScreeningService";

export class JobScreeningService implements IJobScreeningService {
    constructor(
        private readonly evaluator: IJobScreenEvaluator,
        private readonly logger: ILogger
    ) {}

    async screen(jobs: IJobPostLookup[]): Promise<IJobScreenResult[]> {
        this.logger.info(`[JobScreeningService.screen] Screening ${jobs.length} jobs`);
        const results: IJobScreenResult[] = [];
        for (const job of jobs) {
            try {
                const jobInfo = `${job.company} - ${job.requisitionId} (${job.title})`;
                const result = await this.evaluator.evaluate(job);
                this.logger.info(`[JobScreeningService.screen] Screening job: ${jobInfo}`);
                this.logger.info(`\t- Disposition: ${result.disposition}`);
                this.logger.info(`\t- Reason: ${result.reason}`);
                this.logger.info(`\n`);
                results.push(result);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[JobScreeningService.screen] Error during job screening: ${errMsg}`);
            }
        }
        return results;
    }
}
