import OpenAI from "openai";
import { describe, expect, it } from "vitest";
import sanitizeHtml from "sanitize-html";

import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";

import { IJobRequirement } from "./IJobRequirement";
import { JobRequirementsExtractionService } from "./JobRequirementsExtractionService";
import {
    aiAgentsPosting,
    softwareEngineerOnePosting,
} from "./JobRequirementsExtractionRegressionPostings";

interface IStructuredInferenceRequest {
    systemPrompt: string;
    input: unknown;
    schemaName: string;
    jsonSchema: Record<string, unknown>;
    validationSchema: {
        parse(value: unknown): unknown;
    };
    temperature?: number;
    maxTokens?: number;
}

const runRegressionTests = process.env.RUN_LLM_REGRESSION === "1";

const regressionDescribe = runRegressionTests ? describe : describe.skip;

/**
 * INSTRUCTIONS:
 * Set the environment variable RUN_LLM_REGRESSION to "1" to enable regression tests.
 * Ensure the target model's API is running and accessible (Ollama targets expect
 * http://localhost:11434/v1; the Mistral hosted target requires MISTRAL_API_KEY).
 *
 * The model under test is selected via the LLM_TARGET environment variable using a
 * LlmTargetRegistry key (e.g. LLM_TARGET=Qwen3_8b_8k or LLM_TARGET=Mistral_Small_4_hosted).
 * Defaults to Qwen3_4b_Instruct_8k.
 */

const TEST_TIMEOUT_MS = 300_000;

let llm: ILlmInferenceProvider;
let modelLabel = "not configured";

if (runRegressionTests) {
    // Deferred so LlmTargetRegistry (which reads env vars at class-definition time
    // for hosted providers) is only imported when regression tests are actually enabled.
    const { LlmTargetRegistry } = await import(
        "../../../Infrastructure/Inference/OpenAi/LlmTargetRegistry/LlmTargetRegistry"
    );

    const targetName = process.env.LLM_TARGET ?? "Qwen3_4b_Instruct_8k";

    const modelOptions = (LlmTargetRegistry as unknown as Record<
        string,
        { model: string; apiBaseUrl: URL; apiKey: string; reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" }
    >)[targetName];

    if (!modelOptions) {
        throw new Error(
            `Unknown LLM_TARGET "${targetName}". Available targets: ${Object.keys(LlmTargetRegistry).join(", ")}`
        );
    }

    modelLabel = modelOptions.model;

    const client = new OpenAI({
        baseURL: modelOptions.apiBaseUrl.toString(),
        apiKey: modelOptions.apiKey,

        maxRetries: 0,
    });

    llm = {
        async generateStructured<T>(request: IStructuredInferenceRequest): Promise<T> {
            const response = await client.chat.completions.create({
                model: modelOptions.model,
                messages: [
                    {
                        role: "system",
                        content: request.systemPrompt,
                    },
                    {
                        role: "user",
                        content:
                            typeof request.input === "string" ? request.input : JSON.stringify(request.input),
                    },
                ],
                temperature: request.temperature ?? 0.1,
                max_tokens: request.maxTokens ?? 150,
                ...(modelOptions.reasoningEffort !== undefined && {
                    reasoning_effort: modelOptions.reasoningEffort,
                }),
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: request.schemaName,
                        strict: true,
                        schema: request.jsonSchema,
                    },
                },
            });

            const content = response.choices[0]?.message?.content;

            if (!content) {
                throw new Error("Inference returned no content.");
            }

            const parsed: unknown = JSON.parse(content);

            try {
                return request.validationSchema.parse(parsed) as T;
            } catch (error) {
                throw new Error(`Validation failed. Raw model output:\n${content}\n\n${error}`);
            }
        },
    } as unknown as ILlmInferenceProvider;
} else {
    llm = {} as unknown as ILlmInferenceProvider;
}

const logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
} as unknown as ILogger;

const extractionService = new JobRequirementsExtractionService(llm, logger);

interface IExpectedRequirement {
    description: string;
    anyOf: string[][];
}

const aiAgentsExpected: IExpectedRequirement[] = [
    { description: "Python proficiency", anyOf: [["Python"]] },
    { description: "TypeScript", anyOf: [["TypeScript"]] },
    { description: "generative AI applications", anyOf: [["generative AI"]] },
    { description: "agentic coding tools", anyOf: [["agentic coding"]] },
    { description: "cloud platform (AWS and/or Azure)", anyOf: [["AWS"], ["Azure"]] },
    { description: "Kubernetes", anyOf: [["Kubernetes"]] },
    { description: "infrastructure as code (Terraform or CDK)", anyOf: [["Terraform"], ["CDK"]] },
    {
        description: "CI/CD tooling (GitHub Actions or Jenkins)",
        anyOf: [["CI/CD"], ["GitHub Actions"], ["Jenkins"]],
    },
    { description: "distributed production-grade applications", anyOf: [["distributed"]] },
    { description: "agentic runtimes (AWS AgentCore)", anyOf: [["AgentCore"]] },
    { description: "OSS agent frameworks (Strands Agents or LangGraph)", anyOf: [["Strands"], ["LangGraph"]] },
    { description: "Helm", anyOf: [["Helm"]] },
    { description: "observability and distributed tracing", anyOf: [["observability"], ["tracing"]] },
    { description: "zero-trust security", anyOf: [["zero-trust"], ["zero trust"]] },
    { description: "bachelor's degree", anyOf: [["Bachelor"]] },
    { description: "4+ years of software development experience", anyOf: [["4+ years"]] },
    { description: "communication skills", anyOf: [["communication"]] },
];

const softwareEngineerOneExpected: IExpectedRequirement[] = [
    { description: "TypeScript", anyOf: [["typescript"]] },
    { description: "cloud platform (AWS or Azure)", anyOf: [["AWS"], ["Azure"]] },
    { description: "Node", anyOf: [["Node"]] },
    { description: "C#", anyOf: [["C#"]] },
    { description: "API development", anyOf: [["API"]] },
    { description: "AI (Claude code)", anyOf: [["Claude"], ["AI"]] },
    {
        description: "three years of programming/development experience",
        anyOf: [["Three years"], ["3 years"]],
    },
    { description: "bachelor's degree", anyOf: [["Bachelor"]] },
    {
        description: "two additional years of software engineering experience",
        anyOf: [["2 additional years"], ["additional years"]],
    },
    { description: "communication skills", anyOf: [["communication"]] },
    { description: "problem solving and debugging", anyOf: [["debugging"], ["problem solving"]] },
    { description: "leadership", anyOf: [["leadership"]] },
];

const forbiddenTerms = [
    "401(k)",
    "health insurance",
    "paid time off",
    "pension",
    "salary",
    "equal opportunity",
    "volunteer",
    "wellness",
];

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

function sanitizePostingText(description: string): string {
    return sanitizeHtml(description, {
        allowedTags: [],
        allowedAttributes: {},
    });
}

function requirementText(requirement: IJobRequirement): string {
    return `${requirement.name} ${requirement.description} ${requirement.sentenceCapture}`;
}

function containsKeyword(text: string, keyword: string): boolean {
    const haystack = text.toLowerCase();

    // Pure alphanumeric keywords use word-boundary matching so short keywords
    // like "AI" and "Node" do not match inside larger words.
    if (/^[a-z0-9]+$/i.test(keyword)) {
        return new RegExp(`\\b${keyword}\\b`, "i").test(text);
    }

    return haystack.includes(keyword.toLowerCase());
}

function findMatchingRequirements(
    requirements: IJobRequirement[],
    expected: IExpectedRequirement
): IJobRequirement[] {
    return requirements.filter(requirement =>
        expected.anyOf.some(keywordSet =>
            keywordSet.every(keyword => containsKeyword(requirementText(requirement), keyword))
        )
    );
}

function summarize(requirements: IJobRequirement[]): string {
    return requirements.map(requirement => requirement.name).join(" | ") || "<none>";
}

function assertSchemaConformance(requirements: IJobRequirement[]): void {
    expect(requirements.length).toBeGreaterThan(0);

    for (const requirement of requirements) {
        expect(requirement.name, "name must be non-empty").toBeTruthy();
        expect(requirement.description, "description must be non-empty").toBeTruthy();
        expect(requirement.sentenceCapture, "sentenceCapture must be non-empty").toBeTruthy();

        expect(requirement.name.length, `name exceeds 300 characters: "${requirement.name}"`).toBeLessThanOrEqual(
            300
        );
        expect(
            requirement.description.length,
            `description exceeds 500 characters: "${requirement.description}"`
        ).toBeLessThanOrEqual(500);
        expect(
            requirement.sentenceCapture.length,
            `sentenceCapture exceeds 1000 characters: "${requirement.sentenceCapture}"`
        ).toBeLessThanOrEqual(1000);
    }
}

function assertSentenceCapturesAreVerbatim(requirements: IJobRequirement[], posting: IJobPostDetail): void {
    const normalizedPosting = normalizeWhitespace(sanitizePostingText(posting.description));

    for (const requirement of requirements) {
        expect(
            normalizedPosting.includes(normalizeWhitespace(requirement.sentenceCapture)),
            `sentenceCapture is not verbatim posting text: "${requirement.sentenceCapture}"`
        ).toBe(true);
    }
}

function assertExpectedRequirements(
    requirements: IJobRequirement[],
    expected: IExpectedRequirement[]
): void {
    const missing = expected.filter(item => findMatchingRequirements(requirements, item).length === 0);

    expect(
        missing,
        `Missing expected requirements: ${missing.map(item => item.description).join("; ")}. ` +
            `Extracted: ${summarize(requirements)}`
    ).toHaveLength(0);
}

function assertForbiddenTermsAbsent(requirements: IJobRequirement[]): void {
    for (const requirement of requirements) {
        const text = requirementText(requirement).toLowerCase();
        const found = forbiddenTerms.filter(term => text.includes(term.toLowerCase()));

        expect(
            found,
            `Requirement "${requirement.name}" mentions excluded content: ${found.join(", ")}`
        ).toHaveLength(0);
    }
}

regressionDescribe("Job requirements extraction LLM regression", () => {
    describe(`model: ${modelLabel}`, () => {
        it(
            "extracts expected requirements from the AI agents and harnesses posting",
            async () => {
                const requirements = await extractionService.extract(aiAgentsPosting);

                expect(requirements.length).toBeGreaterThanOrEqual(10);
                expect(requirements.length).toBeLessThanOrEqual(100);

                assertSchemaConformance(requirements);
                assertSentenceCapturesAreVerbatim(requirements, aiAgentsPosting);
                assertExpectedRequirements(requirements, aiAgentsExpected);
                assertForbiddenTermsAbsent(requirements);
            },
            TEST_TIMEOUT_MS
        );

        it(
            "extracts expected requirements from the software engineer I posting",
            async () => {
                const requirements = await extractionService.extract(softwareEngineerOnePosting);

                expect(requirements.length).toBeGreaterThanOrEqual(6);
                expect(requirements.length).toBeLessThanOrEqual(100);

                assertSchemaConformance(requirements);
                assertSentenceCapturesAreVerbatim(requirements, softwareEngineerOnePosting);
                assertExpectedRequirements(requirements, softwareEngineerOneExpected);
                assertForbiddenTermsAbsent(requirements);
            },
            TEST_TIMEOUT_MS
        );
    });
});
