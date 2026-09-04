import { IJobPostDiscovery } from "../../../../Domain/JobPosts/IJobPostDiscovery";
import { IJobScreenResult } from "../IJobScreenResult";
import { ILogger } from "../../../../Infrastructure/Logging/ILogger";
import { IJobScreeningService } from "../IJobScreeningService";
import { JobScreenSystemPrompt } from "../JobScreenSystemPrompt";
import { JobScreenResponseSchema } from "../JobScreenResponseSchema";
import { JobScreenResponseValidationSchema } from "../JobScreenResponseValidationSchema";
import { ILlmInferenceProvider } from "../../../../Infrastructure/Inference/ILlmInferenceProvider";

export class JobScreeningService implements IJobScreeningService {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger
    ) {}

    async screen(job: IJobPostDiscovery): Promise<IJobScreenResult> {
        const jobInfo = `${job.company} - ${job.requisitionId} (${job.title})`;
        this.logger.info(`[JobScreeningService.screen] Screening job`);

        const result = await this.llm.generateStructured({
            systemPrompt: JobScreenSystemPrompt,
            input: job,

            schemaName: "job_screening",
            jsonSchema: JobScreenResponseSchema,
            validationSchema: JobScreenResponseValidationSchema,

            temperature: 0.2,
            maxTokens: 80,
        });
        this.logger.info(`${jobInfo}`);
        this.logger.info(`\t- Disposition: ${result.disposition}`);
        this.logger.info(`\t- Reason: ${result.reason}`);
        this.logger.info(`\n`);

        return { ...result, job };
    }

    /** @deprecated use screen instead. */
    async screenList(jobs: IJobPostDiscovery[]): Promise<IJobScreenResult[]> {
        this.logger.info(`[JobScreeningService.screen] Screening ${jobs.length} jobs`);
        const results: IJobScreenResult[] = [];
        for (const job of jobs) {
            try {
                const result = await this.screen(job);
                results.push(result);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[JobScreeningService.screen] Error during job screening: ${errMsg}`);
            }
        }
        return results;
    }
}
