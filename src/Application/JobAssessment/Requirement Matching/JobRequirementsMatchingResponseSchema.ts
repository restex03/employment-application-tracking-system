export const JobRequirementsMatchingResponseSchema = {
    type: "object",
    properties: {
        matches: {
            type: "array",
            items: {
                oneOf: [
                    {
                        type: "object",
                        properties: {
                            index: {
                                type: "integer",
                                minimum: 0,
                            },
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
                        required: ["index", "matchType", "evidence"],
                        additionalProperties: false,
                    },
                    {
                        type: "object",
                        properties: {
                            index: {
                                type: "integer",
                                minimum: 0,
                            },
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
                        required: ["index", "matchType", "evidence"],
                        additionalProperties: false,
                    },
                    {
                        type: "object",
                        properties: {
                            index: {
                                type: "integer",
                                minimum: 0,
                            },
                            matchType: {
                                type: "string",
                                enum: ["missing"],
                            },
                            evidence: {
                                type: "null",
                            },
                        },
                        required: ["index", "matchType", "evidence"],
                        additionalProperties: false,
                    },
                ],
            },
        },
    },
    required: ["matches"],
    additionalProperties: false,
} as const;
