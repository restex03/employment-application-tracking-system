import "dotenv/config";
import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import OpenAI from "openai";
import { describe, expect, it } from "vitest";
import sanitizeHtml from "sanitize-html";

import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { ConsoleLogger } from "../../../Infrastructure/Logging/Console/ConsoleLogger";
import { IJobRequirement } from "./IJobRequirement";
import { JobRequirementsExtractionService } from "./JobRequirementsExtractionService";
import {
    aiAgentsPostingOne,
    aiAgentsPostingTwo,
    softwareEngineerOnePosting,
    softwareEngineeringTwo,
    softwareEngineeringThree,
} from "./JobRequirementsExtractionRegressionPostings";
import { LogLevel } from "../../../Infrastructure/Logging/LogLevel";

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
 * http://localhost:11434/v1; hosted targets read their API keys from the environment).
 *
 * The model under test is selected via the LLM_TARGET environment variable using a
 * LlmTargetRegistry key (e.g. LLM_TARGET=Qwen3_8b_8k or LLM_TARGET=Hosted__).
 * Defaults to Qwen3_4b_Instruct_8k.
 *
 * The per-run inference ceiling is tunable via REGRESSION_TIME_BUDGET_MS (default 45000).
 */

/** Maximum allowed inference time for extracting requirements from a single job post. */
const MAX_INFERENCE_TIME_MS = (() => {
    const parsed = Number.parseInt(process.env.REGRESSION_TIME_BUDGET_MS ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 45_000;
})();

const TEST_TIMEOUT_MS = MAX_INFERENCE_TIME_MS + 30_000;

let modelLabel = "not configured";

async function initialize(): Promise<ILlmInferenceProvider> {
    // Deferred so LlmTargetRegistry (which reads env vars at class-definition time
    // for hosted providers) is only imported when regression tests are actually enabled.
    const { LlmTargetRegistry } =
        await import("../../../Infrastructure/Inference/OpenAi/LlmTargetRegistry/LlmTargetRegistry");

    const targetName = process.env.LLM_TARGET ?? "Qwen3_4b_Instruct_8k";

    const modelOptions = (
        LlmTargetRegistry as unknown as Record<
            string,
            {
                model: string;
                apiBaseUrl: URL;
                apiKey: string;
                reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
            }
        >
    )[targetName];

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
        // Bound hangs at 2x the budget so over-budget models still complete and get
        // persisted (then fail the budget gate with data) instead of being killed early.
        timeout: MAX_INFERENCE_TIME_MS * 2,
    });

    return {
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
                        content: typeof request.input === "string" ? request.input : JSON.stringify(request.input),
                    },
                ],
                temperature: request.temperature ?? 0,
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
}

const llm = runRegressionTests ? await initialize() : ({} as ILlmInferenceProvider);

const logger = new ConsoleLogger(LogLevel.Debug) as ILogger;

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

const softwareEngineerTwoExpected: IExpectedRequirement[] = [
    { description: "bachelor's degree in computer science or related field", anyOf: [["Bachelor"]] },
    {
        description: "3+ years of professional full stack web development experience",
        anyOf: [["3+ years"], ["full stack"]],
    },
    { description: "object-oriented programming (mostly PHP)", anyOf: [["PHP"], ["Object-oriented"]] },
    { description: "relational databases (MySQL)", anyOf: [["MySQL"], ["relational"]] },
    {
        description: "modern JavaScript frameworks (Angular, React, or Vue)",
        anyOf: [["Angular"], ["React"], ["Vue"]],
    },
    { description: "JavaScript, HTML, CSS, and/or MVC frameworks", anyOf: [["JavaScript"], ["MVC"]] },
    { description: "unit and integration testing", anyOf: [["testing"]] },
    {
        description: "distributed system architecture and asynchronous processing (AWS SQS)",
        anyOf: [["SQS"], ["distributed"], ["asynchronous"]],
    },
    {
        description: "automated production logging, monitoring and alerting",
        anyOf: [["monitoring"], ["alerting"], ["logging"]],
    },
    {
        description: "AI-assisted development tools (GitHub Copilot, ChatGPT, Cursor)",
        anyOf: [["Copilot"], ["ChatGPT"], ["Cursor"], ["AI"]],
    },
    {
        description: "incorporating AI into the software development lifecycle",
        anyOf: [["software development lifecycle"], ["AI"]],
    },
    { description: "agile development", anyOf: [["Agile"]] },
];

const softwareEngineerThreeExpected: IExpectedRequirement[] = [
    { description: "bachelor's degree in computer science or related field", anyOf: [["Bachelor"]] },
    {
        description: "5+ years of professional full stack web development experience",
        anyOf: [["5+ years"], ["full stack"]],
    },
    { description: "object-oriented programming (mostly PHP)", anyOf: [["PHP"], ["Object-oriented"]] },
    { description: "relational databases (MySQL)", anyOf: [["MySQL"], ["relational"]] },
    {
        description: "modern JavaScript frameworks (Angular, React, or Vue)",
        anyOf: [["Angular"], ["React"], ["Vue"]],
    },
    { description: "JavaScript, HTML, CSS, and/or MVC frameworks", anyOf: [["JavaScript"], ["MVC"]] },
    { description: "unit and integration testing", anyOf: [["testing"]] },
    {
        description: "distributed system architecture and asynchronous processing (AWS SQS)",
        anyOf: [["SQS"], ["distributed"], ["asynchronous"]],
    },
    {
        description: "automated production logging, monitoring and alerting",
        anyOf: [["monitoring"], ["alerting"], ["logging"]],
    },
    { description: "agile development", anyOf: [["Agile"]] },
    // Preferred skills are asserted too: the extraction prompt treats every stated
    // qualification as REQUIRED, with no preferred/optional distinction.
    {
        description: "scaling real-time high availability APIs",
        anyOf: [["high availability"], ["real-time"], ["scaling"]],
    },
    {
        description: "payment gateway/processor integrations (Stripe, Elavon, etc.)",
        anyOf: [["Stripe"], ["payment gateway"]],
    },
    {
        description: "finance and banking process concepts (merchant accounts, ACH, settlement)",
        anyOf: [["ACH"], ["merchant account"], ["settlement"], ["banking"]],
    },
];

const aiAgentsTwoExpected: IExpectedRequirement[] = [
    {
        description: "4+ years of software development experience (API-led, microservice solutions)",
        anyOf: [["4+ years"], ["microservice"]],
    },
    { description: "cloud technologies (GCP and Azure) with production deployment", anyOf: [["GCP"], ["Azure"]] },
    { description: "developing AI agentic solutions", anyOf: [["Agentic"], ["AI agent"]] },
    { description: ".NET development (C#)", anyOf: [[".NET"], ["C#"]] },
    { description: "Python scripting", anyOf: [["Python"]] },
    { description: "YAML CI/CD workflows (GitHub Actions)", anyOf: [["CI/CD"], ["GitHub Actions"]] },
    { description: "AI agent development and skills creation (YAML, Markdown)", anyOf: [["YAML"], ["Markdown"]] },
    {
        description: "containerized applications in production (Kubernetes, Docker, Helm)",
        anyOf: [["Kubernetes"], ["Docker"], ["Helm"]],
    },
    { description: "mentoring other software engineers", anyOf: [["mentor"]] },
    { description: "computer science fundamentals", anyOf: [["fundamentals"]] },
    { description: "BS in computer science or equivalent experience", anyOf: [["BS"], ["Bachelor"]] },
    // "Experience we hope to see" is asserted too: the extraction prompt treats
    // every stated qualification as REQUIRED, with no preferred/optional distinction.
    { description: "Typescript, Javascript, Go", anyOf: [["Typescript"], ["Javascript"], ["Go"]] },
    { description: "MCP server development and management", anyOf: [["MCP"]] },
    { description: "Atlassian tool stack", anyOf: [["Atlassian"]] },
    {
        description: "observability tooling (Splunk, AppDynamics)",
        anyOf: [["Splunk"], ["AppDynamics"], ["observability"]],
    },
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

// TODO: Review
function requirementText(requirement: IJobRequirement): string {
    return `${requirement.name.join(" ")} ${requirement.sentenceCapture}`;
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

function findMatchingRequirements(requirements: IJobRequirement[], expected: IExpectedRequirement): IJobRequirement[] {
    return requirements.filter(requirement =>
        expected.anyOf.some(keywordSet =>
            keywordSet.every(keyword => containsKeyword(requirementText(requirement), keyword))
        )
    );
}

function summarize(requirements: IJobRequirement[]): string {
    return requirements.map(requirement => requirement.formattedName()).join(" | ") || "<none>";
}

function assertSchemaConformance(requirements: IJobRequirement[]): void {
    expect(requirements.length).toBeGreaterThan(0);

    for (const requirement of requirements) {
        expect(requirement.name.length, "name must have at least one entry").toBeGreaterThan(0);
        expect(requirement.sentenceCapture, "sentenceCapture must be non-empty").toBeTruthy();

        for (const name of requirement.name) {
            expect(name.length, `name entry exceeds 300 characters: "${name}"`).toBeLessThanOrEqual(300);
        }

        if (requirement.type === "single") {
            expect(
                requirement.name.length,
                `single requirement must have exactly one entry: "${requirement.name}"`
            ).toBe(1);
        }

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

function assertExpectedRequirements(requirements: IJobRequirement[], expected: IExpectedRequirement[]): void {
    const missing = expected.filter(item => findMatchingRequirements(requirements, item).length === 0);

    expect(
        missing,
        `Missing expected requirements: [${missing.map(item => item.description).join("; ")}]\n. ` +
            `\nExtracted: ${summarize(requirements)}`
    ).toHaveLength(0);
}

function assertForbiddenTermsAbsent(requirements: IJobRequirement[]): void {
    for (const requirement of requirements) {
        const text = requirementText(requirement).toLowerCase();
        const found = forbiddenTerms.filter(term => text.includes(term.toLowerCase()));

        expect(found, `Requirement "${requirement.name}" mentions excluded content: ${found.join(", ")}`).toHaveLength(
            0
        );
    }
}

interface IExtractionCase {
    posting: IJobPostDetail;
    expected: IExpectedRequirement[];
    label: string;
    minRequirements: number;
}

/**
 * Extracts one posting once, persists the result, then asserts the quality gates.
 * Results are persisted before any assertion so a failing model's output still
 * lands in the results file. Inference failures are persisted as failure entries.
 */
async function runExtractionCase(extractionCase: IExtractionCase): Promise<void> {
    const inferenceStart = performance.now();

    let requirements: IJobRequirement[];
    try {
        requirements = await extractionService.extract(extractionCase.posting);
    } catch (error) {
        await persistFailure({
            modelName: modelLabel,
            caseLabel: extractionCase.label,
            elapsedMs: performance.now() - inferenceStart,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }

    const elapsedMs = performance.now() - inferenceStart;

    await persistResults({
        modelName: modelLabel,
        caseLabel: extractionCase.label,
        requirements,
        elapsedMs,
    });

    expect(
        elapsedMs,
        `Requirement extraction exceeded the ${MAX_INFERENCE_TIME_MS / 1000} second inference budget`
    ).toBeLessThanOrEqual(MAX_INFERENCE_TIME_MS);

    expect(requirements.length).toBeGreaterThanOrEqual(extractionCase.minRequirements);
    expect(requirements.length).toBeLessThanOrEqual(100);

    assertSchemaConformance(requirements);
    assertSentenceCapturesAreVerbatim(requirements, extractionCase.posting);
    assertExpectedRequirements(requirements, extractionCase.expected);
    assertForbiddenTermsAbsent(requirements);
}

regressionDescribe("Job requirements extraction LLM regression", () => {
    describe(`model: ${modelLabel}`, () => {
        console.log(`Running regression tests for model: ${modelLabel}`);

        it(
            "extracts expected requirements from the AI agents and harnesses posting",
            () =>
                runExtractionCase({
                    posting: aiAgentsPostingOne,
                    expected: aiAgentsExpected,
                    label: "AI agents and harnesses",
                    minRequirements: 10,
                }),
            TEST_TIMEOUT_MS
        );

        it(
            "extracts expected requirements from the software engineer I posting",
            () =>
                runExtractionCase({
                    posting: softwareEngineerOnePosting,
                    expected: softwareEngineerOneExpected,
                    label: "Software engineer I",
                    minRequirements: 6,
                }),
            TEST_TIMEOUT_MS
        );

        it(
            "extracts expected requirements from the software engineer two (Billing & Payments) posting",
            () =>
                runExtractionCase({
                    posting: softwareEngineeringTwo,
                    expected: softwareEngineerTwoExpected,
                    label: "Software engineer two (Billing & Payments)",
                    minRequirements: 8,
                }),
            TEST_TIMEOUT_MS
        );

        it(
            "extracts expected requirements from the senior software engineer (Patient Payments) posting",
            () =>
                runExtractionCase({
                    posting: softwareEngineeringThree,
                    expected: softwareEngineerThreeExpected,
                    label: "Senior software engineer (Patient Payments)",
                    minRequirements: 10,
                }),
            TEST_TIMEOUT_MS
        );

        it(
            "extracts expected requirements from the AI engineer (Tools Platform) posting",
            () =>
                runExtractionCase({
                    posting: aiAgentsPostingTwo,
                    expected: aiAgentsTwoExpected,
                    label: "AI engineer (Tools Platform)",
                    minRequirements: 10,
                }),
            TEST_TIMEOUT_MS
        );
    });
});

function tableCell(text: string): string {
    return text.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
}

/** Appends a results section, separated from prior entries by a horizontal rule. */
async function appendResultsSection(content: string): Promise<void> {
    const outputPath = resolve(import.meta.dirname, "../../../../log-docs/job-requirements-test-results.md");

    let existingContent = "";
    try {
        existingContent = await readFile(outputPath, { encoding: "utf-8" });
    } catch {
        // File does not exist yet; no separator is needed before the first entry.
    }

    const separator = existingContent.length > 0 ? "\n---\n\n" : "";
    await appendFile(outputPath, separator + content, { encoding: "utf-8" });
}

async function persistResults(results: {
    modelName: string;
    caseLabel: string;
    requirements: IJobRequirement[];
    elapsedMs: number;
}): Promise<void> {
    const timestamp = new Date().toLocaleString();

    const requirementRows = results.requirements.map(
        (requirement, index) =>
            `| ${index + 1} | ${tableCell(requirement.formattedName())} | ${requirement.type} | ${tableCell(
                requirement.sentenceCapture
            )} |`
    );

    await appendResultsSection(
        `## Model: ${results.modelName}\n` +
            `### Case: ${results.caseLabel}\n` +
            `### Recorded at: ${timestamp}\n\n` +
            `### Elapsed: ${(results.elapsedMs / 1000).toFixed(2)}s\n\n` +
            `| Count | Requirement | Type | Sentence Capture |\n` +
            `| --- | --- | --- | --- |\n` +
            requirementRows.join("\n") +
            `\n`
    );
}

/** Records an inference failure (timeout, validation error, etc.) in the results file. */
async function persistFailure(results: {
    modelName: string;
    caseLabel: string;
    elapsedMs: number;
    error: string;
}): Promise<void> {
    const timestamp = new Date().toLocaleString();

    await appendResultsSection(
        `## Model: ${results.modelName} — ${results.caseLabel}\n\n` +
            `### Recorded at: ${timestamp}\n\n` +
            `### Elapsed: ${(results.elapsedMs / 1000).toFixed(2)}s\n\n` +
            `### Failed: <span style="color:red">${tableCell(results.error)}</span>\n`
    );
}
