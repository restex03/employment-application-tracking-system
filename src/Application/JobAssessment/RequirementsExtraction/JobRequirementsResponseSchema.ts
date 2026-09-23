export const JobRequirementsResponseSchema = {
    type: "object",
    properties: {
        requirements: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        minLength: 1,
                        maxLength: 300,
                    },
                    description: {
                        type: "string",
                        minLength: 1,
                        maxLength: 500,
                    },
                    sentenceCapture: {
                        type: "string",
                        minLength: 1,
                        maxLength: 1000,
                    },
                },
                required: ["name", "description", "sentenceCapture"],
                additionalProperties: false,
            },
        },
    },
    required: ["requirements"],
    additionalProperties: false,
} as const;
