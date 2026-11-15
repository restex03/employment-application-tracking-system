export const JobRequirementTransferableMatchResponseSchema = {
    oneOf: [
        {
            type: "object",
            properties: {
                isTransferableMatch: {
                    type: "boolean",
                    enum: [true],
                },
                evidence: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500,
                },
            },
            required: ["isTransferableMatch", "evidence"],
            additionalProperties: false,
        },
        {
            type: "object",
            properties: {
                isTransferableMatch: {
                    type: "boolean",
                    enum: [false],
                },
                evidence: {
                    type: "null",
                },
            },
            required: ["isTransferableMatch", "evidence"],
            additionalProperties: false,
        },
    ],
} as const;
