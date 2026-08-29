import { z } from "zod";

const ScoreSchema = z.number().int().min(0).max(100);

const MatchEvidenceSchema = z.strictObject({
    requirement: z.string(),
    candidateEvidence: z.string(),

    strength: z.enum(["strong", "moderate", "weak"]),
});

const SkillGapSchema = z.strictObject({
    skill: z.string(),

    severity: z.enum(["minor", "moderate", "major", "disqualifying"]),

    type: z.enum(["learnable", "transferable", "experience", "domain", "structural", "career_risk"]),

    reason: z.string(),

    reasonablyLearnable: z.boolean(),
});

const JobEvaluationScoresSchema = z.strictObject({
    currentSkillFit: ScoreSchema,

    experienceFit: ScoreSchema,

    workFit: ScoreSchema,

    skillPortability: ScoreSchema,

    careerGrowth: ScoreSchema,

    compensationFit: ScoreSchema,

    locationFit: ScoreSchema,
});

const EligibilitySchema = z.strictObject({
    passesHardConstraints: z.boolean(),

    reasons: z.array(z.string()),
});

const ProprietaryTechnologyRiskSchema = z.strictObject({
    level: z.enum(["low", "moderate", "high", "unknown"]),

    reason: z.string(),
});

export const JobEvaluationSchema = z.strictObject({
    jobId: z.string(),

    recommendation: z.enum(["strong_apply", "apply", "maybe", "skip"]),

    confidence: z.number().min(0).max(1),

    scores: JobEvaluationScoresSchema,

    eligibility: EligibilitySchema,

    strongMatches: z.array(MatchEvidenceSchema),

    gaps: z.array(SkillGapSchema),

    transferableSkills: z.array(z.string()),

    careerRisks: z.array(z.string()),

    proprietaryTechnologyRisk: ProprietaryTechnologyRiskSchema,

    summary: z.string(),

    primaryConcern: z.string().nullable(),

    interviewQuestions: z.array(z.string()),
});
