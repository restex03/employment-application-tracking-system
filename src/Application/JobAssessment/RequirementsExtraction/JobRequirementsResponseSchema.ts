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
                    description: {
                        type: "string",
                        maxLength: 500,
                    },
                },
                required: ["area", "description"],
                additionalProperties: false,
            },
        },
    },
    required: ["requirements"],
    additionalProperties: false,
} as const;
