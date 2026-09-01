export const JobRequirementClassificationResponseSchema = {
    type: "object",
    properties: {
        classifications: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    index: {
                        type: "integer",
                        minimum: 0,
                    },
                    category: {
                        type: "string",
                        enum: [
                            "technical_skill",
                            "technical_skill_depth",
                            "domain_experience",
                            "role_scope",
                            "education",
                            "certification",
                            "other",
                        ],
                    },
                },
                required: ["index", "category"],
                additionalProperties: false,
            },
        },
    },
    required: ["classifications"],
    additionalProperties: false,
} as const;
