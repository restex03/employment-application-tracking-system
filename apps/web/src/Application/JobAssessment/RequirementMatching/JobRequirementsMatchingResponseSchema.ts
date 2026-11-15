export const JobRequirementMatchingResponseSchema = {
    oneOf: [
        {
            type: "object",
            properties: {
                matchType: {
                    type: "string",
                    enum: ["direct"],
                },
                evidence: {
                    type: "string",
                    minLength: 1,
                    maxLength: 300,
                },
            },
            required: ["matchType", "evidence"],
            additionalProperties: false,
        },
        {
            type: "object",
            properties: {
                matchType: {
                    type: "string",
                    enum: ["transferable"],
                },
                evidence: {
                    type: "string",
                    minLength: 1,
                    maxLength: 300,
                },
            },
            required: ["matchType", "evidence"],
            additionalProperties: false,
        },
        {
            type: "object",
            properties: {
                matchType: {
                    type: "string",
                    enum: ["missing"],
                },
                evidence: {
                    type: "null",
                },
            },
            required: ["matchType", "evidence"],
            additionalProperties: false,
        },
    ],
} as const;
