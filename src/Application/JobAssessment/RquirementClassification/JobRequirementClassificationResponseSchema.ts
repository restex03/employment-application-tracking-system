const requirementSchema = {
    type: "object",
    properties: {
        area: {
            type: "string",
            maxLength: 80,
        },
        description: {
            type: "string",
            maxLength: 250,
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
    required: ["area", "description", "category"],
    additionalProperties: false,
} as const;

export const JobRequirementClassificationResponseSchema = {
    type: "object",
    properties: {
        requirements: {
            type: "array",
            items: requirementSchema,
        },
    },
    required: ["requirements"],
    additionalProperties: false,
} as const;
