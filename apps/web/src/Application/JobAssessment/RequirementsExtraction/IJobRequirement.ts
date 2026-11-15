export type JobRequirementType = "single" | "and" | "or";

export interface IJobRequirement {
    /** The capability entities this requirement covers. Always exactly one entry when type is "single". */
    name: string[];
    /** How the entities combine: "single" (one entity), "and" (all required), "or" (any satisfies). */
    type: JobRequirementType;
    sentenceCapture: string;

    formattedName(): string;
}
