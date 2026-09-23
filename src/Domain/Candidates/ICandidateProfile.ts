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

export type WorkArrangement = "remote" | "hybrid" | "onsite" | "unknown";

export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary" | "internship" | "unknown";

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
export interface IWorkAuthorization {
    citizenshipCountry: string;
    authorizedToWorkInUS: boolean;
    requiresSponsorship: boolean;
}
export interface ICandidateEducation {
    degreeType: "associate" | "bachelor" | "master" | "doctorate" | "other";

    field: string;
    institution?: string;
    completed: boolean;
}

export interface ICandidateProfile {
    id: string;

    currentTitle?: string;

    totalYearsExperience: number;
    workAuthorization: IWorkAuthorization;
    education: ICandidateEducation[];

    skills: ISkill[];

    experience: ICandidateExperience[];

    /**
     * High-level engineering strengths that aren't always captured
     * by keyword matching.
     */
    strengths: string[];

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
