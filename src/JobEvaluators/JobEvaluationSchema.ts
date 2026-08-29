const scoreSchema = {
    type: "integer",
    minimum: 0,
    maximum: 100,
} as const;

export const JOB_EVALUATION_SCHEMA = {
    type: "object",

    properties: {
        jobId: {
            type: "string",
        },

        recommendation: {
            type: "string",

            enum: ["strong_apply", "apply", "maybe", "skip"],
        },

        confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
        },

        scores: {
            type: "object",

            properties: {
                currentSkillFit: scoreSchema,

                experienceFit: scoreSchema,

                workFit: scoreSchema,

                skillPortability: scoreSchema,

                careerGrowth: scoreSchema,

                compensationFit: scoreSchema,

                locationFit: scoreSchema,
            },

            required: [
                "currentSkillFit",
                "experienceFit",
                "workFit",
                "skillPortability",
                "careerGrowth",
                "compensationFit",
                "locationFit",
            ],

            additionalProperties: false,
        },

        eligibility: {
            type: "object",

            properties: {
                passesHardConstraints: {
                    type: "boolean",
                },

                reasons: {
                    type: "array",

                    items: {
                        type: "string",
                    },
                },
            },

            required: ["passesHardConstraints", "reasons"],

            additionalProperties: false,
        },

        strongMatches: {
            type: "array",

            items: {
                type: "object",

                properties: {
                    requirement: {
                        type: "string",
                    },

                    candidateEvidence: {
                        type: "string",
                    },

                    strength: {
                        type: "string",

                        enum: ["strong", "moderate", "weak"],
                    },
                },

                required: ["requirement", "candidateEvidence", "strength"],

                additionalProperties: false,
            },
        },

        gaps: {
            type: "array",

            items: {
                type: "object",

                properties: {
                    skill: {
                        type: "string",
                    },

                    severity: {
                        type: "string",

                        enum: ["minor", "moderate", "major", "disqualifying"],
                    },

                    type: {
                        type: "string",

                        enum: ["learnable", "transferable", "experience", "domain", "structural", "career_risk"],
                    },

                    reason: {
                        type: "string",
                    },

                    reasonablyLearnable: {
                        type: "boolean",
                    },
                },

                required: ["skill", "severity", "type", "reason", "reasonablyLearnable"],

                additionalProperties: false,
            },
        },

        transferableSkills: {
            type: "array",

            items: {
                type: "string",
            },
        },

        careerRisks: {
            type: "array",

            items: {
                type: "string",
            },
        },

        proprietaryTechnologyRisk: {
            type: "object",

            properties: {
                level: {
                    type: "string",

                    enum: ["low", "moderate", "high", "unknown"],
                },

                reason: {
                    type: "string",
                },
            },

            required: ["level", "reason"],

            additionalProperties: false,
        },

        summary: {
            type: "string",
        },

        primaryConcern: {
            type: ["string", "null"],
        },

        interviewQuestions: {
            type: "array",

            items: {
                type: "string",
            },
        },
    },

    required: [
        "jobId",
        "recommendation",
        "confidence",
        "scores",
        "eligibility",
        "strongMatches",
        "gaps",
        "transferableSkills",
        "careerRisks",
        "proprietaryTechnologyRisk",
        "summary",
        "primaryConcern",
        "interviewQuestions",
    ],

    additionalProperties: false,
} as const;
