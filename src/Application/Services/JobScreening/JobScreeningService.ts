import { IJobScreenEvaluator } from "../../../Evaluators/JobScreenEvaluator/IJobScreenEvaluator";
import { IJobScreenResult } from "../../../Evaluators/JobScreenEvaluator/IJobScreenResult";
import { IJobSearchResult } from "../../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { ILogger } from "../../Common/Logging/ILogger";
import { IJobScreeningService } from "./IJobScreeningService";

export class JobScreeningService implements IJobScreeningService {
    constructor(
        private readonly evaluator: IJobScreenEvaluator,
        private readonly logger: ILogger
    ) {}

    async screen(jobs: IJobSearchResult[]): Promise<IJobScreenResult[]> {
        this.logger.info(`[JobScreeningService.screen] Screening ${jobs.length} jobs`);
        const results: IJobScreenResult[] = [];
        for (const job of jobs) {
            try {
                const result = await this.evaluator.screenJob(job);
                this.logger.info(
                    `[JobScreeningService.screen] Screening job: ${job.company} - ${job.id} (${job.title})`
                );
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
