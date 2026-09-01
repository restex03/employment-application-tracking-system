export const JobRequirementsResponseSchema = {
    type: "object",
    properties: {
        requirements: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    area: {
                        type: "string",
                        maxLength: 80,
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
                    description: {
                        type: "string",
                        maxLength: 250,
                    },
                },
                required: ["area", "category", "description"],
                additionalProperties: false,
            },
        },
    },
    required: ["requirements"],
    additionalProperties: false,
} as const;
