import OpenAI from "openai";
import { describe, expect, it } from "vitest";
import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { ILlmInferenceProvider } from "../../../Infrastructure/Inference/ILlmInferenceProvider";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IClassifiedJobRequirement } from "../RquirementClassification/IClassifiedJobRequirement";
import { JobRequirementDirectMatchingService } from "./DirectMatching/JobRequirementDirectMatchingService";
import { JobRequirementTransferableMatchingService } from "./TransferableMatching/JobRequirementTransferableMatchingService";

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

const client = new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    apiKey: "ollama",
});

const model = process.env.OLLAMA_MODEL ?? "qwen3:4b-instruct-8k";

const llm = {
    async generateStructured<T>(request: IStructuredInferenceRequest): Promise<T> {
        const response = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: request.systemPrompt,
                },
                {
                    role: "user",
                    content: JSON.stringify(request.input),
                },
            ],
            temperature: request.temperature ?? 0.1,
            max_tokens: request.maxTokens ?? 150,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: request.schemaName,
                    strict: true,
                    schema: request.jsonSchema,
                },
            },
        });

        const content = response.choices[0]?.message.content;

        if (!content) {
            throw new Error("Inference returned no content.");
        }

        const parsed: unknown = JSON.parse(content);

        return request.validationSchema.parse(parsed) as T;
    },
} as unknown as ILlmInferenceProvider;

const logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
} as unknown as ILogger;

const directMatchingService = new JobRequirementDirectMatchingService(llm, logger);

const transferableMatchingService = new JobRequirementTransferableMatchingService(llm, logger);

function createRequirement(area: string, description: string): IClassifiedJobRequirement {
    return {
        area,
        description,
        category: "technical_skill",
    };
}

function createProfile(
    skills: Array<{
        name: string;
        category: string;
        level: string;
        years?: number;
        productionExperience?: boolean;
        context?: string;
    }>,
    overrides: Partial<ICandidateProfile> = {}
): ICandidateProfile {
    return {
        title: "Software Engineer",
        totalYears: 7,
        skills,
        experience: [],
        strengths: [],
        desiredWork: [],
        growthAreas: [],
        avoid: [],
        careerPriorities: [],
        preferences: {},
        constraints: {},
        ...overrides,
    } as unknown as ICandidateProfile;
}

regressionDescribe("Job requirement matching LLM regression", () => {
    describe("direct matching", () => {
        it("does not directly match a five-year AWS requirement from AWS exposure alone", async () => {
            const requirement = createRequirement("AWS Experience", "5+ years of professional experience using AWS.");

            const profile = createProfile([
                {
                    name: "AWS",
                    category: "cloud",
                    level: "exposure",
                    years: 1,
                    productionExperience: false,
                    context: "Limited hands-on AWS exposure.",
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("does not directly match an AND requirement when only Git is present", async () => {
            const requirement = createRequirement(
                "Source Control and Build Tools",
                "Experience with Git and at least one of the following build tools: Maven or Gradle."
            );

            const profile = createProfile([
                {
                    name: "Git",
                    category: "tool",
                    level: "strong",
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("directly matches an AND requirement when both sides are explicitly supported", async () => {
            const requirement = createRequirement(
                "Source Control and Build Tools",
                "Experience with Git and at least one of the following build tools: Maven or Gradle."
            );

            const profile = createProfile([
                {
                    name: "Git",
                    category: "tool",
                    level: "strong",
                    productionExperience: true,
                },
                {
                    name: "Maven",
                    category: "tool",
                    level: "strong",
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(true);
            expect(result.evidence).not.toBeNull();
        });

        it("does not directly match Java, Python, and JavaScript when only JavaScript is supported", async () => {
            const requirement = createRequirement(
                "Programming Languages",
                "2+ years experience working with Java, Python, and JavaScript programming languages."
            );

            const profile = createProfile([
                {
                    name: "JavaScript",
                    category: "language",
                    level: "strong",
                    years: 5,
                    productionExperience: true,
                },
                {
                    name: "TypeScript",
                    category: "language",
                    level: "strong",
                    years: 5,
                    productionExperience: true,
                },
                {
                    name: "C#",
                    category: "language",
                    level: "expert",
                    years: 7,
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("does not substitute related backend technologies for explicit Java and Spring Boot requirements", async () => {
            const requirement = createRequirement(
                "Java and Spring Boot",
                "Professional backend development experience using Java and Spring Boot."
            );

            const profile = createProfile([
                {
                    name: "C#",
                    category: "language",
                    level: "expert",
                    years: 7,
                    productionExperience: true,
                    context: "Production backend service development.",
                },
                {
                    name: ".NET",
                    category: "framework",
                    level: "expert",
                    years: 7,
                    productionExperience: true,
                    context: "Production backend APIs and services.",
                },
                {
                    name: "Entity Framework Core",
                    category: "framework",
                    level: "strong",
                    years: 5,
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("does not substitute total career experience for requirement-specific years", async () => {
            const requirement = createRequirement(
                "Software Testing and Quality",
                "2+ years experience with software testing, performance, and quality engineering techniques and strategies."
            );

            const profile = createProfile(
                [
                    {
                        name: "Performance Optimization",
                        category: "architecture",
                        level: "strong",
                        productionExperience: true,
                        context: "Production debugging and root-cause analysis.",
                    },
                ],
                {
                    totalYears: 7,
                } as Partial<ICandidateProfile>
            );

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("directly matches an OR requirement through PostgreSQL", async () => {
            const requirement = createRequirement(
                "Spring or Relational Database",
                "Experience with Spring Boot or a relational database such as PostgreSQL."
            );

            const profile = createProfile([
                {
                    name: "PostgreSQL",
                    category: "database",
                    level: "strong",
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(true);
            expect(result.evidence).not.toBeNull();
        });

        it("directly matches a cloud OR requirement when AWS is explicitly supported", async () => {
            const requirement = createRequirement(
                "Cloud Platform",
                "Experience with cloud technology: GCP, AWS, or Azure."
            );

            const profile = createProfile([
                {
                    name: "AWS",
                    category: "cloud",
                    level: "working",
                    years: 2,
                    productionExperience: true,
                    context: "Production AWS experience.",
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(true);
            expect(result.evidence).not.toBeNull();
        });

        it("does not directly match a closed configuration-management list using unrelated DevOps tools", async () => {
            const requirement = createRequirement(
                "Configuration Management",
                "Experience with Chef, Puppet, Ansible, or Salt Stack."
            );

            const profile = createProfile([
                {
                    name: "Jenkins",
                    category: "devops",
                    level: "strong",
                    productionExperience: true,
                },
                {
                    name: "SonarQube",
                    category: "devops",
                    level: "strong",
                    productionExperience: true,
                },
                {
                    name: "Nexus",
                    category: "devops",
                    level: "strong",
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("does not directly match a three-of-N threshold with only one accepted technology", async () => {
            const requirement = createRequirement(
                "Programming and Platform Technologies",
                "Experience with at least 3 of the following: Java, Python, Go, C++, Kubernetes, Terraform."
            );

            const profile = createProfile([
                {
                    name: "Python",
                    category: "language",
                    level: "working",
                    productionExperience: true,
                },
                {
                    name: "C#",
                    category: "language",
                    level: "expert",
                    productionExperience: true,
                },
                {
                    name: ".NET",
                    category: "framework",
                    level: "expert",
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("directly matches a three-of-N threshold when three accepted technologies are present", async () => {
            const requirement = createRequirement(
                "Programming and Platform Technologies",
                "Experience with at least 3 of the following: Java, Python, Go, C++, Kubernetes, Terraform."
            );

            const profile = createProfile([
                {
                    name: "Python",
                    category: "language",
                    level: "working",
                    productionExperience: true,
                },
                {
                    name: "C++",
                    category: "language",
                    level: "working",
                    productionExperience: true,
                },
                {
                    name: "Kubernetes",
                    category: "devops",
                    level: "working",
                    productionExperience: true,
                },
            ]);

            const result = await directMatchingService.assess(requirement, profile);

            expect(result.isDirectMatch).toBe(true);
            expect(result.evidence).not.toBeNull();
        });
    });

    describe("transferable matching", () => {
        it("recognizes .NET backend experience as transferable to Java and Spring Boot", async () => {
            const requirement = createRequirement(
                "Java / Spring Boot",
                "Professional backend development experience using Java and Spring Boot."
            );

            const profile = createProfile([
                {
                    name: "C#",
                    category: "language",
                    level: "expert",
                    years: 7,
                    productionExperience: true,
                    context: "Production backend service development.",
                },
                {
                    name: ".NET",
                    category: "framework",
                    level: "expert",
                    years: 7,
                    productionExperience: true,
                    context: "Production backend APIs and services.",
                },
            ]);

            const result = await transferableMatchingService.assess(requirement, profile);

            expect(result.isTransferableMatch).toBe(true);
            expect(result.evidence).not.toBeNull();
        });

        it("does not treat Git and CI/CD as transferable Agile methodology evidence", async () => {
            const requirement = createRequirement(
                "Agile Methodologies",
                "Experience working with Agile software development methodologies."
            );

            const profile = createProfile([
                {
                    name: "Git",
                    category: "tool",
                    level: "strong",
                    productionExperience: true,
                },
                {
                    name: "Jenkins",
                    category: "devops",
                    level: "strong",
                    productionExperience: true,
                    context: "CI/CD pipeline automation.",
                },
            ]);

            const result = await transferableMatchingService.assess(requirement, profile);

            expect(result.isTransferableMatch).toBe(false);
            expect(result.evidence).toBeNull();
        });

        it("recognizes AWS cloud engineering as transferable to GCP cloud engineering", async () => {
            const requirement = createRequirement(
                "GCP Cloud Engineering",
                "Professional experience designing and deploying services on Google Cloud Platform."
            );

            const profile = createProfile([
                {
                    name: "AWS",
                    category: "cloud",
                    level: "strong",
                    years: 3,
                    productionExperience: true,
                    context: "Designed and deployed production services on AWS, including cloud service integration.",
                },
            ]);

            const result = await transferableMatchingService.assess(requirement, profile);

            expect(result.isTransferableMatch).toBe(true);
            expect(result.evidence).not.toBeNull();
        });
    });
});
