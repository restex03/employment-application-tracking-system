export const JobRequirementDirectMatchResponseSchema = {
    oneOf: [
        {
            type: "object",
            properties: {
                isDirectMatch: {
                    type: "boolean",
                    enum: [true],
                },
                evidence: {
                    type: "string",
                    minLength: 1,
                    maxLength: 300,
                },
            },
            required: ["isDirectMatch", "evidence"],
            additionalProperties: false,
        },
        {
            type: "object",
            properties: {
                isDirectMatch: {
                    type: "boolean",
                    enum: [false],
                },
                evidence: {
                    type: "null",
                },
            },
            required: ["isDirectMatch", "evidence"],
            additionalProperties: false,
        },
    ],
} as const;
