const scoreSchema = {
    type: "integer",
    minimum: 0,
    maximum: 100,
} as const;

/**
 * JSON Schema describing the expected model response for a job score evaluation.
 * This is used as the response_format schema sent to the model.
 */
export const JobScoreEvaluationResponseSchema = {
    type: "object",

    properties: {
        scores: {
            type: "object",
            properties: {
                currentSkillFit: scoreSchema,
                experienceFit: scoreSchema,
                workFit: scoreSchema,
                skillPortability: scoreSchema,
                careerGrowth: scoreSchema,
            },
            required: ["currentSkillFit", "experienceFit", "workFit", "skillPortability", "careerGrowth"],
            additionalProperties: false,
        },

        strengths: {
            type: "array",
            maxItems: 3,
            items: {
                type: "object",
                properties: {
                    area: {
                        type: "string",
                        maxLength: 80,
                    },
                    type: {
                        type: "string",
                        enum: ["direct", "transferable"],
                    },
                    reason: {
                        type: "string",
                        maxLength: 250,
                    },
                },
                required: ["area", "type", "reason"],
                additionalProperties: false,
            },
        },

        gaps: {
            type: "array",
            maxItems: 3,
            items: {
                type: "object",
                properties: {
                    area: {
                        type: "string",
                        maxLength: 80,
                    },
                    severity: {
                        type: "string",
                        enum: ["minor", "moderate", "major"],
                    },
                    category: {
                        type: "string",
                        enum: [
                            "technical_skill",
                            "technical_skill_depth",
                            "domain_experience",
                            "role_scope",
                            "career_alignment",
                        ],
                    },
                    reason: {
                        type: "string",
                        maxLength: 250,
                    },
                },
                required: ["area", "severity", "category", "reason"],
                additionalProperties: false,
            },
        },
    },

    required: ["scores", "strengths", "gaps"],

    additionalProperties: false,
} as const;
