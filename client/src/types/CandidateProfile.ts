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
    name: string;
    category: SkillCategory;
    level: SkillLevel;
    years?: number;
    productionExperience?: boolean;
    context?: string;
}

export interface ICandidateExperience {
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    highlights: string[];
    domains?: string[];
}

export interface ILocationPreference {
    city?: string;
    state?: string;
    country: string;
    maxCommuteMinutes?: number;
}

export interface ICompensationPreference {
    minimumBaseSalary?: number;
    targetBaseSalary?: number;
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

export interface ICareerPriorities {
    technicalOwnership: number;
    architectureDepth: number;
    skillPortability: number;
    learningOpportunity: number;
    compensation: number;
    stability: number;
    workLifeBalance?: number;
}

export interface ICandidatePreferences {
    workArrangements: WorkArrangement[];
    locations: ILocationPreference[];
    compensation: ICompensationPreference;
    employmentTypes?: EmploymentType[];
}

export interface ICandidateConstraints {
    requiresRemoteOrApprovedHybridLocation?: boolean;
    requiresSponsorship?: boolean;
    hardConstraints?: string[];
}

export interface ICandidateProfile {
    id: string;
    currentTitle?: string;
    totalYearsExperience: number;
    workAuthorization: IWorkAuthorization;
    education: ICandidateEducation[];
    skills: ISkill[];
    experience: ICandidateExperience[];
    strengths: string[];
    desiredWork: string[];
    desiredGrowthAreas: string[];
    avoidWork: string[];
    careerPriorities: ICareerPriorities;
    preferences: ICandidatePreferences;
    constraints: ICandidateConstraints;
}
