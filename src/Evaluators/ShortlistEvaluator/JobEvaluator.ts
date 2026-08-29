import { IJobEvaluator } from "./IJobEvaluator";

import { type ICandidateProfile, type IJobEvaluation } from "./types";

import { JobEvaluationResponseSchema } from "./JobEvaluationResponseSchema";

import { JobEvaluationResponseValidationSchema } from "./JobEvaluationResponseValidationSchema";

import { IJobPostingDetail } from "../../APIs/JobSources/IJobPostingDetail";
import { IJobCompatibilityScoreCalculator } from "../../JobCompatibilityCalculators/IJobCompatibilityScoreCalculator";
import { JobCompatibilityScoreCalculator } from "../../JobCompatibilityCalculators/JobCompatibilityScoreCalculator";
import { OpenAiConnection } from "../../ModelConnections/Ollama/OllamaClientConnection";
import { ILogger } from "../../Application/Common/Logger/ILogger";

export class JobEvaluator implements IJobEvaluator {
    constructor(
        private readonly openAi: OpenAiConnection,
        private readonly logger: ILogger,
        // private readonly model: string = "openai/gpt-oss-120b",
        private readonly model: string = "qwen3:4b-instruct-8k",
        // private readonly model: string = "qwen3:8b",
        private readonly scoreCalculator: IJobCompatibilityScoreCalculator = new JobCompatibilityScoreCalculator()
    ) {}

    async evaluate(profile: ICandidateProfile, job: IJobPostingDetail): Promise<IJobEvaluation> {
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
                    schema: JobEvaluationResponseSchema,
                },
            },
        });

        const elapsed = performance.now() - start;

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error(`Model returned no evaluation content for job ${job.id}.`);
        }

        this.logger.debug("********************************************************");
        this.logger.debug("*************** Model Response Analysis ****************");
        this.logger.debug("********************************************************");
        this.logger.debug(`Evaluation time (s): ${(elapsed / 1000).toFixed(1)}`);
        this.logger.debug(`Prompt tokens: ${response.usage?.prompt_tokens}`);
        this.logger.debug(`Completion tokens: ${response.usage?.completion_tokens}`);
        this.logger.debug(`Content returned from model: \n${content}`);
        this.logger.debug(`Completion chars: ${content!.length}`);
        this.logger.debug(`Finish reason: ${response.choices[0]?.finish_reason}`);
        this.logger.debug("********************************************************");
        this.logger.debug("********************************************************");

        let json: unknown;

        try {
            json = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `Model returned invalid JSON for job ${job.id}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const validationResult = JobEvaluationResponseValidationSchema.safeParse(json);

        if (!validationResult.success) {
            const validationErrors = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";

                    return `${path}: ${issue.message}`;
                })
                .join("; ");

            throw new Error(`Model returned an invalid evaluation for job ${job.id}: ${validationErrors}`);
        }

        const { primaryConcern, ...raw } = validationResult.data;

        const evaluationWithoutScore: Omit<IJobEvaluation, "overallScore"> = {
            ...raw,

            ...(primaryConcern !== null ? { primaryConcern } : {}),
        };

        const overallScore = this.scoreCalculator.calculate(evaluationWithoutScore);

        return {
            ...evaluationWithoutScore,
            overallScore,
        };
    }

    private readonly systemPrompt = `
You are a software engineering job-matching system.

Your job is to evaluate how well the supplied job fits the supplied candidate.

Evaluate only the supplied position.

Pay particular attention to:

- current technical skill fit
- transferable engineering experience
- backend and platform engineering experience
- system architecture and design depth
- engineering ownership
- distributed systems experience
- production engineering experience
- AI and agentic-system experience
- opportunities to learn valuable new technologies
- long-term skill portability
- career growth
- compensation
- location and work-arrangement constraints

IMPORTANT MATCHING RULES:

Do not perform simplistic keyword matching.

Do not reject a candidate merely because they lack a particular
framework, library, cloud service, or programming language when their
underlying engineering experience is strongly transferable.

Differentiate between:

1. Learnable gaps
   Example: LangGraph, Helm, Terraform.

2. Transferable gaps
   Example: Python when the candidate has extensive backend engineering
   experience in C# and TypeScript.

3. Significant experience gaps
   Example: a role requiring extensive ML research experience when the
   candidate has primarily software engineering experience.

4. Structural gaps
   Example: a role explicitly requiring 8 years of Python when the
   candidate has none.

5. Career risks
   Example: highly proprietary technology whose expertise has limited
   value outside one vendor ecosystem.

Consider whether the job offers:

- architecture/design responsibility
- technical ownership
- conventional engineering practices
- reusable systems rather than one-off solutions
- developer tooling
- platform engineering
- distributed systems
- AI infrastructure
- production responsibility

Scores must be integers from 0 through 100.

Confidence must be between 0 and 1.

Recommendations must mean:

strong_apply:
Excellent match or unusually strong career opportunity.

apply:
Good match worth pursuing.

maybe:
Some meaningful fit, but important concerns exist.

skip:
Poor match, hard constraint failure, or limited career value.

Do not invent candidate experience.

Candidate evidence must be supported by the supplied candidate profile.

A missing technology must not be described as candidate experience.

The returned jobId MUST exactly match the supplied job.id.

Keep summaries and reasons concise and useful.
`;
}
