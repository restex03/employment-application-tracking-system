import { IJobMatchEvaluator } from "../IJobMatchEvaluator";

import { type ICandidateProfile, type IJobMatchEvaluation } from "../types";

import { JobMatchEvaluationResponseSchema } from "../JobMatchEvaluationResponseSchema";

import { JobMatchEvaluationResponseValidationSchema } from "../JobMatchEvaluationResponseValidationSchema";

import { IJobPostingDetail } from "../../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { IJobCompatibilityScoreCalculator } from "../../../JobCompatibilityCalculators/IJobCompatibilityScoreCalculator";
import { JobCompatibilityScoreCalculator } from "../../../JobCompatibilityCalculators/JobCompatibilityScoreCalculator";
import { OpenAiConnection } from "../../../ModelConnections/Ollama/OllamaClientConnection";
import { ILogger } from "../../../Application/Common/Logging/ILogger";
import { JobMatchEvaluatorSystemPrompt } from "../JobMatchEvaluatorSystemPrompt";

export class OllamaJobMatchEvaluator implements IJobMatchEvaluator {
    constructor(
        private readonly openAi: OpenAiConnection,
        private readonly logger: ILogger,
        private readonly model: string = "qwen3:4b-instruct-8k",
        // private readonly model: string = "qwen3:8b",
        private readonly scoreCalculator: IJobCompatibilityScoreCalculator = new JobCompatibilityScoreCalculator()
    ) {}

    async evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobMatchEvaluation> {
        const jobInfo = `${job.company} - ${job.id} (${job.title})`;
        this.logger.debug(`[OllamaJobMatchEvaluator.evaluate] Evaluating job: ${jobInfo}`);
        const start = performance.now();
        const response = await this.openAi.client.chat.completions.create({
            model: this.model,

            temperature: 0.1,

            messages: [
                {
                    role: "system",
                    content: this.systemPrompt,
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        candidate: profile,
                        job,
                    }),
                },
            ],

            response_format: {
                type: "json_schema",

                json_schema: {
                    name: "job_evaluation",
                    strict: true,
                    schema: JobMatchEvaluationResponseSchema,
                },
            },
        });

        const elapsed = performance.now() - start;

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error(`[OllamaJobMatchEvaluator.evaluate] Model returned no content for ${jobInfo}.`);
        }

        this.logger.debug("********************************************************");
        this.logger.debug("*************** Model Response Analysis ****************");
        this.logger.debug("********************************************************");
        this.logger.debug(`\tEvaluation time (s): ${(elapsed / 1000).toFixed(1)}`);
        this.logger.debug(`\tPrompt tokens: ${response.usage?.prompt_tokens}`);
        this.logger.debug(`\tCompletion tokens: ${response.usage?.completion_tokens}`);
        this.logger.debug(`\tCompletion chars: ${content!.length}`);
        this.logger.debug(`\tFinish reason: ${response.choices[0]?.finish_reason}`);
        this.logger.debug("********************************************************");
        this.logger.debug("********************************************************");

        let json: unknown;

        try {
            json = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `[OllamaJobMatchEvaluator.evaluate] Model returned invalid JSON for ${jobInfo}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const validationResult = JobMatchEvaluationResponseValidationSchema.safeParse(json);

        if (!validationResult.success) {
            const validationErrors = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

                    return `${path}: ${issue.message}`;
                })
                .join("; ");

            throw new Error(
                `[OllamaJobMatchEvaluator.evaluate] Model returned invalid evaluation data for ${jobInfo}: ${validationErrors}`
            );
        }

        const { primaryConcern, ...raw } = validationResult.data;

        const evaluationWithoutScore: Omit<IJobMatchEvaluation, "overallScore"> = {
            ...raw,

            ...(primaryConcern !== null ? { primaryConcern } : {}),
        };

        const overallScore = this.scoreCalculator.calculate(evaluationWithoutScore);

        return {
            ...evaluationWithoutScore,
            overallScore,
        };
    }

    private readonly systemPrompt = JobMatchEvaluatorSystemPrompt;
}
