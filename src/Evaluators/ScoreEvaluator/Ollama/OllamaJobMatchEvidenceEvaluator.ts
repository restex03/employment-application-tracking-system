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
        this.logger.debug(`[OllamaJobMatchEvidenceEvaluator.evaluate] Evaluating job: ${jobInfo}`);

        const result = await this.llm.generateStructured({
            model: this.model,
            systemPrompt: JobMatchEvidenceExtractorSystemPrompt,

            input: {
                candidate: profile,
                job,
            },

            schemaName: "job_evaluation",
            jsonSchema: JobScoreEvaluationResponseSchema,
            validationSchema: JobScoreEvaluationResponseValidationSchema,

            temperature: 0.1,
        });

        return new JobMatchEvidence(job.title, result.strengths, result.gaps);
    }

    private readonly systemPrompt = JobMatchEvidenceExtractorSystemPrompt;
}
