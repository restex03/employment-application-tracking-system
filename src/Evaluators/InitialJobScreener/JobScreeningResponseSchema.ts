export const JobScreeningResponseSchema = {
    type: "object",
    properties: {
        decision: {
            type: "string",
            enum: ["advance", "reject", "review"],
        },
        reason: {
            type: "string",
            maxLength: 100,
        },
    },
    required: ["decision", "reason"],
    additionalProperties: false,
} as const;
