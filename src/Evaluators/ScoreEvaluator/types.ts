export type WorkArrangement = "remote" | "hybrid" | "onsite" | "unknown";

export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary" | "internship" | "unknown";

export type SkillLevel = "expert" | "strong" | "working" | "exposure" | "learning";

export type SkillCategory =
    | "language"
    | "framework"
    | "cloud"
    | "database"
    | "messaging"
    | "devops"
    | "architecture"
    | "ai"
    | "security"
    | "testing"
    | "observability"
    | "domain"
    | "tool"
    | "other";

export interface ISkill {
    /**
     * Prefer normalized names:
     * "TypeScript", "C#", "Kubernetes", "REST APIs", "LangGraph"
     */
    name: string;

    category: SkillCategory;

    level: SkillLevel;

    /**
     * Only provide this when reasonably known.
     * Don't invent years merely to improve matching.
     */
    years?: number;

    /**
     * Useful for differentiating:
     * "used in production"
     * vs.
     * "studied / experimented with"
     */
    productionExperience?: boolean;

    /**
     * Short factual context.
     *
     * Example:
     * "Built TypeScript integrations between enterprise REST APIs
     * and Sierra AI AgentSDK."
     */
    context?: string;
}

export interface ILocationPreference {
    city?: string;
    state?: string;
    country: string;

    /**
     * Useful for your Roswell use case.
     */
    maxCommuteMinutes?: number;
}

export interface ICompensationPreference {
    /**
     * Your hard walk-away number.
     */
    minimumBaseSalary?: number;

    /**
     * What you'd actually like.
     */
    targetBaseSalary?: number;

    /**
     * Whether bonus/equity can compensate for a somewhat lower base.
     */
    considerVariableCompensation?: boolean;
}

export interface ICandidateExperience {
    title: string;
    company: string;

    startDate?: string; // YYYY-MM
    endDate?: string; // YYYY-MM or omit if current

    current?: boolean;

    /**
     * Don't dump 20 resume bullets here.
     * Keep these to meaningful engineering accomplishments.
     */
    highlights: string[];

    domains?: string[];
}

export interface ICandidateProfile {
    id: string;

    currentTitle?: string;

    totalYearsExperience: number;

    education?: {
        degree?: string;
        field?: string;
    };

    skills: ISkill[];

    experience: ICandidateExperience[];

    /**
     * High-level engineering strengths that aren't always captured
     * by keyword matching.
     */
    strengths: string[];

    /**
     * What you actually want to spend your time doing.
     *
     * Examples:
     * - "system architecture"
     * - "backend engineering"
     * - "distributed systems"
     * - "developer tooling"
     * - "AI agent infrastructure"
     */
    desiredWork: string[];

    /**
     * Career directions you actively want to develop.
     *
     * Examples:
     * - "Kubernetes"
     * - "AWS"
     * - "Python"
     * - "agent orchestration"
     * - "observability"
     */
    desiredGrowthAreas: string[];

    /**
     * Things that can make an otherwise technically matching job
     * unattractive.
     */
    avoidWork: string[];

    /**
     * Concepts particularly important to your job search.
     */
    careerPriorities: {
        technicalOwnership: number; // 0-100
        architectureDepth: number; // 0-100
        skillPortability: number; // 0-100
        learningOpportunity: number; // 0-100
        compensation: number; // 0-100
        stability: number; // 0-100
        workLifeBalance?: number; // 0-100
    };

    preferences: {
        workArrangements: WorkArrangement[];

        locations: ILocationPreference[];

        compensation: ICompensationPreference;

        employmentTypes?: EmploymentType[];
    };

    constraints: {
        /**
         * Useful for normal filtering without putting sensitive
         * information into the LLM prompt unnecessarily.
         */
        requiresRemoteOrApprovedHybridLocation?: boolean;

        /**
         * True if candidate requires employer sponsorship.
         */
        requiresSponsorship?: boolean;

        /**
         * Other legitimate hard constraints.
         *
         * Example:
         * "No more than 30 minutes commute from Roswell, GA"
         */
        hardConstraints?: string[];
    };
}
