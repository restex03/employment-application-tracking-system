import OpenAI from "openai";

import { IJobEvaluator } from "../IJobEvaluator";
import {
    type ICandidateProfile,
    type IJobEvaluation,
    type IJobPosting,
} from "./types";

import { JOB_EVALUATION_SCHEMA } from "./GroqJobEvaluationSchema";
import { GroqEvaluationResponseSchema } from "../GroqEvaluationResponseSchema";

export class GroqJobEvaluator implements IJobEvaluator {
    private readonly client: OpenAI;

    constructor(
        apiKey: string = process.env.GROQ_API_KEY ?? "",
        private readonly model: string = "openai/gpt-oss-120b",
    ) {
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is not configured.");
        }

        this.client = new OpenAI({
            apiKey,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }

    async evaluate(
        profile: ICandidateProfile,
        jobs: IJobPosting[],
    ): Promise<IJobEvaluation[]> {
        if (jobs.length === 0) {
            return [];
        }

        const response = await this.client.chat.completions.create({
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
                        jobs,
                    }),
                },
            ],

            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "job_evaluations",
                    strict: true,
                    schema: JOB_EVALUATION_SCHEMA,
                },
            },
        });

        const content =
            response.choices[0]?.message?.content;

        if (!content) {
            throw new Error(
                "Groq returned no evaluation content.",
            );
        }

        let json: unknown;

        try {
            json = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `Groq returned invalid JSON: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`,
            );
        }

        const validationResult =
            GroqEvaluationResponseSchema.safeParse(json);

        if (!validationResult.success) {
            const validationErrors =
                validationResult.error.issues
                    .map(issue => {
                        const path =
                            issue.path.length > 0
                                ? issue.path.join(".")
                                : "<root>";

                        return `${path}: ${issue.message}`;
                    })
                    .join("; ");

            throw new Error(
                `Groq returned an invalid evaluation response: ${validationErrors}`,
            );
        }

        const parsed = validationResult.data;

return parsed.rankings.map(raw => {
    const {
        primaryConcern,
        ...rest
    } = raw;

    const evaluation: IJobEvaluation = {
        ...rest,

        ...(primaryConcern !== null
            ? { primaryConcern }
            : {}),

        // The application owns this calculation.
        overallScore: 0,
    };

    evaluation.overallScore =
        this.calculateOverallScore(evaluation);

    return evaluation;
});
    }

    private calculateOverallScore(
        evaluation: IJobEvaluation,
    ): number {
        if (
            !evaluation.eligibility
                .passesHardConstraints
        ) {
            return 0;
        }

        const s = evaluation.scores;

        const score =
            s.currentSkillFit * 0.25 +
            s.experienceFit * 0.15 +
            s.workFit * 0.20 +
            s.skillPortability * 0.15 +
            s.careerGrowth * 0.15 +
            s.compensationFit * 0.05 +
            s.locationFit * 0.05;

        return Math.round(score);
    }

    private readonly systemPrompt = `
You are a software engineering job-matching system.

Your job is to evaluate how well each job fits the supplied candidate.

Evaluate each position independently.

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

Keep summaries and reasons concise and useful.
`;
}