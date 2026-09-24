import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";

export type JobRequirementCategory =
    | "technical_skill"
    | "technical_skill_depth"
    | "domain_experience"
    | "role_scope"
    | "education"
    | "certification"
    | "other";

export interface IClassifiedJobRequirement extends IJobRequirement {
    category: JobRequirementCategory;
}
