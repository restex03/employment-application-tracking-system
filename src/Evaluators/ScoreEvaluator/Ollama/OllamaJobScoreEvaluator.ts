import { IJobMatchEvidenceEvaluator } from "../IJobMatchEvidenceEvaluator";
import { JobScoreEvaluationResponseSchema } from "../JobScoreEvaluationResponseSchema";
import { JobScoreEvaluationResponseValidationSchema } from "../JobScoreEvaluationResponseValidationSchema";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { JobMatchEvidenceExtractorSystemPrompt } from "../JobScoreEvaluatorSystemPrompt";
import { IJobMatchEvidence, JobMatchEvidence } from "../IJobMatchEvidence";
import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";

export class OllamaJobMatchEvidenceEvaluator implements IJobMatchEvidenceEvaluator {
    constructor(
        private readonly llm: ILlmInferenceProvider,
        private readonly logger: ILogger,
        private readonly model: string = "qwen3:4b-instruct-8k"
    ) {}

    async evaluate(profile: ICandidateProfile, job: IJobPostDetail): Promise<IJobMatchEvidence> {
        const jobInfo = `${job.company} - ${job.requisitionId} (${job.title})`;
        this.logger.debug(`[OllamaJobScoreEvaluator.evaluate] Evaluating job: ${jobInfo}`);
        const start = performance.now();
        const response = await this.llm.client.chat.completions.create({
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
                    schema: JobScoreEvaluationResponseSchema,
                },
            },
        });

        const elapsed = performance.now() - start;

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error(`[OllamaJobScoreEvaluator.evaluate] Model returned no content for ${jobInfo}.`);
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

        let json: unknown;

        try {
            json = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `[OllamaJobScoreEvaluator.evaluate] Model returned invalid JSON for ${jobInfo}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const validationResult = JobScoreEvaluationResponseValidationSchema.safeParse(json);

        if (!validationResult.success) {
            const validationErrors = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

                    return `${path}: ${issue.message}`;
                })
                .join("; ");

            throw new Error(
                `[OllamaJobScoreEvaluator.evaluate] Model returned invalid evaluation data for ${jobInfo}: ${validationErrors}`
            );
        }

        const { ...raw } = validationResult.data;

        const result: IJobMatchEvidence = new JobMatchEvidence(job.title, raw.strengths, raw.gaps);
        return result;
    }

    private readonly systemPrompt = JobMatchEvidenceExtractorSystemPrompt;
}
