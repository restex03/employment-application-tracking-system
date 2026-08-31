import { z } from "zod";

/**
 * Runtime validator for the model response after it has been parsed from JSON.
 * This ensures the model output matches the application's expected evaluation shape.
 */
const ScoreSchema = z.number().int().min(0).max(100);

const JobStrengthSchema = z.strictObject({
    area: z.string().min(1),
    type: z.enum(["direct", "transferable"]),
    reason: z.string().min(1),
});

const JobScoreGapSchema = z.strictObject({
    area: z.string().min(1),

    severity: z.enum(["minor", "moderate", "major"]),

    category: z.enum([
        "technical_skill",
        "technical_skill_depth",
        "domain_experience",
        "role_scope",
        "career_alignment",
    ]),

    reason: z.string().min(1),
});

const JobEvaluationScoresSchema = z.strictObject({
    currentSkillFit: ScoreSchema,

    experienceFit: ScoreSchema,

    workFit: ScoreSchema,

    skillPortability: ScoreSchema,

    careerGrowth: ScoreSchema,
});

/**
 * Zod schema used to validate and type the parsed job-evaluation JSON.
 * This is the application-side safety check after the model response arrives.
 */
export const JobScoreEvaluationResponseValidationSchema = z.strictObject({
    scores: JobEvaluationScoresSchema,

    gaps: z.array(JobScoreGapSchema).max(3),

    strengths: z.array(JobStrengthSchema).max(3),
});
