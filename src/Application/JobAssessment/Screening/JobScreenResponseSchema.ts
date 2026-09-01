export const JobScreenResponseSchema = {
    type: "object",
    properties: {
        disposition: {
            type: "string",
            enum: ["advance", "reject", "review"],
        },
        reason: {
            type: "string",
            maxLength: 100,
        },
    },
    required: ["disposition", "reason"],
    additionalProperties: false,
} as const;
