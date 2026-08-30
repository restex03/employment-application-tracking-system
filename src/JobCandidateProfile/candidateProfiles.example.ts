import { ICandidateProfile } from "../Evaluators/ScoreEvaluator/types.js";

/**
 * Example candidate profile used to demonstrate job matching/evaluation.
 *
 * This profile contains fictional data and is safe to commit to source control.
 *
 * To create your own profile:
 * 1. Copy this file to a local file such as `candidateProfiles.ts`.
 * 2. Replace the example values with your actual experience and preferences.
 * 3. Add the local profile file to `.gitignore`.
 *
 * The evaluator uses this information to determine how well a job posting
 * aligns with the candidate's:
 * - existing skills and experience
 * - career direction
 * - desired growth areas
 * - compensation requirements
 * - location/work-arrangement preferences
 * - hard constraints
 *
 * Keep descriptions factual. The evaluator can make better decisions when
 * skills distinguish between production experience, working knowledge,
 * and technologies the candidate only wants to learn.
 */
const exampleCandidateProfile: ICandidateProfile = {
    /**
     * Stable identifier for this profile.
     *
     * This does not need to be a person's real name. A descriptive identifier
     * such as "backend-engineer-example" is sufficient.
     */
    id: "backend-engineer-example",

    /**
     * Candidate's current or most recent professional title.
     *
     * Use the title that best describes the candidate's present level and
     * responsibilities rather than an aspirational title.
     */
    currentTitle: "Software Engineer",

    /**
     * Approximate total professional experience.
     *
     * Fractional years are acceptable when useful (for example, 5.5).
     */
    totalYearsExperience: 5,

    /**
     * Technologies and engineering competencies the candidate currently has.
     *
     * Guidelines:
     *
     * - `name`
     *   Name of the technology, platform, or engineering discipline.
     *
     * - `category`
     *   Broad classification used to organize skills. Use one of the categories
     *   supported by ICandidateProfile, such as language, framework, architecture,
     *   messaging, devops, cloud, database, ai, security, or tool.
     *
     * - `level`
     *   Describe the candidate's actual proficiency. Avoid inflating skills simply
     *   because they appear in a target job posting.
     *
     * - `years`
     *   Optional. Useful for technologies where years of experience are meaningful.
     *
     * - `productionExperience`
     *   Indicates whether the skill has been used in a real production environment.
     *
     * - `context`
     *   Optional but valuable. Explain how the skill was actually used so the
     *   evaluator can distinguish meaningful experience from keyword matches.
     */
    skills: [
        // Languages
        {
            name: "TypeScript",
            category: "language",
            level: "strong",
            years: 4,
            productionExperience: true,
            context: "Primary language for backend services, REST APIs, integrations, and asynchronous processing.",
        },
        {
            name: "C#",
            category: "language",
            level: "working",
            years: 3,
            productionExperience: true,
            context: "Used for backend APIs, business applications, and service integrations.",
        },
        {
            name: "SQL",
            category: "language",
            level: "strong",
            years: 5,
            productionExperience: true,
            context: "Used for application data access, reporting, troubleshooting, and query optimization.",
        },

        // Frameworks / application technologies
        {
            name: "Node.js",
            category: "framework",
            level: "strong",
            productionExperience: true,
            context: "Used to build production backend services and API integrations.",
        },
        {
            name: ".NET",
            category: "framework",
            level: "working",
            productionExperience: true,
            context: "Used to build and maintain backend services and enterprise applications.",
        },

        // Architecture
        {
            name: "REST APIs",
            category: "architecture",
            level: "strong",
            productionExperience: true,
            context: "Designed and consumed REST APIs across distributed backend systems.",
        },
        {
            name: "Distributed Systems",
            category: "architecture",
            level: "working",
            productionExperience: true,
            context:
                "Worked with asynchronous services, distributed integrations, retries, and production reliability concerns.",
        },
        {
            name: "Dependency Injection",
            category: "architecture",
            level: "strong",
            productionExperience: true,
        },
        {
            name: "SOLID",
            category: "architecture",
            level: "strong",
            productionExperience: true,
        },
        {
            name: "Event-Driven Architecture",
            category: "architecture",
            level: "working",
            productionExperience: true,
        },

        // Messaging
        {
            name: "RabbitMQ",
            category: "messaging",
            level: "working",
            productionExperience: true,
            context: "Used queues for asynchronous communication between backend services.",
        },

        // DevOps
        {
            name: "Docker",
            category: "devops",
            level: "working",
            productionExperience: true,
        },
        {
            name: "CI/CD",
            category: "devops",
            level: "strong",
            productionExperience: true,
            context: "Built and maintained automated build, test, and deployment pipelines.",
        },
        {
            name: "Linux",
            category: "devops",
            level: "working",
            productionExperience: true,
        },
        {
            name: "Git",
            category: "tool",
            level: "strong",
            productionExperience: true,
        },

        // Cloud
        {
            name: "AWS",
            category: "cloud",
            level: "exposure",
            productionExperience: false,
            context: "Hands-on learning experience with several AWS services; seeking deeper production experience.",
        },

        // Databases
        {
            name: "PostgreSQL",
            category: "database",
            level: "working",
            productionExperience: true,
        },
        {
            name: "SQL Server",
            category: "database",
            level: "working",
            productionExperience: true,
        },

        // AI / agent engineering
        {
            name: "LLM Integrations",
            category: "ai",
            level: "exposure",
            productionExperience: false,
            context: "Built prototypes that integrate language models with application services and structured data.",
        },

        // Production engineering
        {
            name: "Production Support",
            category: "tool",
            level: "strong",
            productionExperience: true,
        },
        {
            name: "Root Cause Analysis",
            category: "tool",
            level: "strong",
            productionExperience: true,
        },
    ],

    /**
     * Professional experience used to evaluate seniority, domain knowledge,
     * scope of responsibility, and transferable engineering experience.
     *
     * These entries do not need to duplicate an entire résumé.
     * Prefer concise highlights describing meaningful engineering work.
     *
     * `domains` should describe the broader areas in which the work occurred.
     * This can help identify transferable experience even when technologies differ.
     */
    experience: [
        {
            title: "Software Engineer",
            company: "Example Technology Company",
            startDate: "2023-01",
            current: true,

            highlights: [
                "Develop backend services and REST APIs using TypeScript and Node.js.",
                "Design integrations between internal applications and third-party services.",
                "Build asynchronous processing workflows using message queues.",
                "Participate in architecture, testing, production support, and technical design decisions.",
                "Maintain CI/CD pipelines and containerized application deployments.",
            ],

            domains: ["enterprise software", "backend engineering", "distributed systems", "platform integration"],
        },

        {
            title: "Software Developer",
            company: "Example Software Company",
            startDate: "2021-01",
            endDate: "2022-12",

            highlights: [
                "Developed and maintained backend business applications.",
                "Built REST API integrations and database-backed services.",
                "Worked with SQL Server and PostgreSQL.",
                "Improved application reliability and performance.",
                "Diagnosed production issues and performed root-cause analysis.",
            ],

            domains: ["backend engineering", "enterprise software", "application development"],
        },
    ],

    /**
     * Engineering areas where the candidate is particularly effective.
     *
     * These are broader than individual technologies and should describe
     * recurring strengths demonstrated throughout the candidate's experience.
     */
    strengths: [
        "Backend software engineering",
        "API and service design",
        "System architecture",
        "Distributed system integrations",
        "Production troubleshooting",
        "Design patterns and SOLID principles",
        "CI/CD and development tooling",
        "Learning unfamiliar technologies",
    ],

    /**
     * Types of work the candidate actively wants to perform.
     *
     * These values help distinguish between:
     *   "I am capable of doing this"
     * and
     *   "I actually want my next role to involve this."
     *
     * Include responsibilities and engineering domains rather than specific
     * employer names.
     */
    desiredWork: [
        "backend engineering",
        "platform engineering",
        "distributed systems",
        "API architecture",
        "cloud-native services",
        "technical ownership",
        "system architecture",
    ],

    /**
     * Skills or disciplines the candidate wants the next role to help develop.
     *
     * A technology does NOT need to already be a strong skill to appear here.
     * This lets the evaluator recognize a job as valuable because it provides
     * useful growth rather than rejecting it solely because experience is limited.
     */
    desiredGrowthAreas: [
        "AWS",
        "Kubernetes",
        "cloud-native architecture",
        "Terraform",
        "observability",
        "distributed tracing",
        "AI application architecture",
    ],

    /**
     * Work the candidate would prefer NOT to make the focus of their next role.
     *
     * These are generally soft negatives. Truly non-negotiable requirements
     * belong in `constraints.hardConstraints` instead.
     */
    avoidWork: [
        "roles dominated by proprietary low-code platforms",
        "support-heavy roles with little software development",
        "pure operations roles",
        "roles with little opportunity for technical ownership",
    ],

    /**
     * Relative importance of major career considerations.
     *
     * Values are expressed on a 0-100 scale.
     *
     * Higher values tell the evaluator that a mismatch in that category should
     * have a greater impact on the overall recommendation.
     *
     * These values are relative priorities rather than percentages and therefore
     * do not need to add up to 100.
     */
    careerPriorities: {
        technicalOwnership: 90,
        architectureDepth: 85,
        skillPortability: 90,
        learningOpportunity: 90,
        compensation: 80,
        stability: 70,
        workLifeBalance: 75,
    },

    /**
     * Practical preferences for the next job.
     *
     * These are generally preferences rather than automatic rejection criteria.
     * Put requirements that must never be violated under `constraints`.
     */
    preferences: {
        /**
         * Work arrangements the candidate is willing to consider.
         *
         * Common examples include "remote" and "hybrid".
         */
        workArrangements: ["remote", "hybrid"],

        /**
         * Geographic areas where an in-person or hybrid role is practical.
         *
         * Add `maxCommuteMinutes` when commute time matters.
         *
         * Replace these example locations with locations relevant to the
         * candidate's actual job search.
         */
        locations: [
            {
                city: "Example City",
                state: "GA",
                country: "US",
                maxCommuteMinutes: 30,
            },
        ],

        /**
         * Compensation expectations.
         *
         * `minimumBaseSalary` represents the point below which a role normally
         * should not be recommended.
         *
         * `targetBaseSalary` represents the compensation level the candidate
         * would ideally like to achieve.
         *
         * When `considerVariableCompensation` is true, bonuses or similar
         * compensation may be considered when evaluating overall compensation.
         */
        compensation: {
            minimumBaseSalary: 100_000,
            targetBaseSalary: 125_000,
            considerVariableCompensation: true,
        },

        /**
         * Employment arrangements the candidate wants to consider.
         */
        employmentTypes: ["full_time"],
    },

    /**
     * Non-negotiable requirements.
     *
     * Unlike `preferences`, violating these should normally cause the evaluator
     * to reject or strongly penalize a job.
     *
     * Keep hard constraints limited to things that truly make accepting the
     * position impractical or impossible.
     */
    constraints: {
        /**
         * When true, a role must either be remote or located within one of the
         * candidate's approved hybrid locations.
         */
        requiresRemoteOrApprovedHybridLocation: true,

        /**
         * Set to true only when the candidate requires employer-sponsored
         * work authorization.
         */
        requiresSponsorship: false,

        /**
         * Human-readable constraints supplied to the evaluator.
         *
         * Use these for nuanced requirements that cannot be represented by
         * the structured fields above.
         */
        hardConstraints: [
            "Must be fully remote or offer a practical hybrid arrangement near an approved location.",
            "Full-time employment strongly preferred.",
        ],
    },
};

/**
 * Collection of candidate profiles available to the application.
 *
 * Additional profiles can be added here if the application needs to evaluate
 * jobs from multiple candidate perspectives or test different career strategies.
 *
 * Example:
 *
 * export const profiles = {
 *     backendEngineer: exampleCandidateProfile,
 *     anotherProfile,
 * };
 */
export const profiles = {
    exampleCandidateProfile,
};
