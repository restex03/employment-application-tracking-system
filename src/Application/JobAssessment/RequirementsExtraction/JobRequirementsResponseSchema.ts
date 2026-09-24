export const JobRequirementsResponseSchema = {
    type: "object",
    properties: {
        requirements: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "array",
                        items: {
                            type: "string",
                            minLength: 1,
                            maxLength: 300,
                        },
                        minItems: 1,
                    },
                    type: {
                        type: "string",
                        enum: ["single", "and", "or"],
                    },
                    sentenceCapture: {
                        type: "string",
                        minLength: 1,
                        maxLength: 1000,
                    },
                },
                required: ["name", "type", "sentenceCapture"],
                additionalProperties: false,
            },
        },
    },
    required: ["requirements"],
    additionalProperties: false,
} as const;
