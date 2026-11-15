// export const JobRequirementsResponseSchema = {
//     type: "object",
//     properties: {
//         requirements: {
//             type: "array",
//             items: {
//                 type: "object",
//                 properties: {
//                     name: {
//                         type: "array",
//                         items: {
//                             type: "string",
//                             minLength: 1,
//                             maxLength: 300,
//                         },
//                         minItems: 1,
//                     },
//                     type: {
//                         type: "string",
//                         enum: ["single", "and", "or"],
//                     },
//                     sentenceCapture: {
//                         type: "string",
//                         minLength: 1,
//                         maxLength: 1000,
//                     },
//                 },
//                 required: ["name", "type", "sentenceCapture"],
//                 additionalProperties: false,
//             },
//         },
//     },
//     required: ["requirements"],
//     additionalProperties: false,
// } as const;

export const JobRequirementSchema = {
    oneOf: [
        {
            type: "object",
            properties: {
                name: {
                    type: "array",
                    minItems: 1,
                    maxItems: 1,
                    items: {
                        type: "string",
                        maxLength: 300,
                    },
                },
                type: {
                    const: "single",
                },
                sentenceCapture: {
                    type: "string",
                    maxLength: 1000,
                },
            },
            required: ["name", "type", "sentenceCapture"],
            additionalProperties: false,
        },
        {
            type: "object",
            properties: {
                name: {
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "string",
                        maxLength: 300,
                    },
                },
                type: {
                    const: "and",
                },
                sentenceCapture: {
                    type: "string",
                    maxLength: 1000,
                },
            },
            required: ["name", "type", "sentenceCapture"],
            additionalProperties: false,
        },
        {
            type: "object",
            properties: {
                name: {
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "string",
                        maxLength: 300,
                    },
                },
                type: {
                    const: "or",
                },
                sentenceCapture: {
                    type: "string",
                    maxLength: 1000,
                },
            },
            required: ["name", "type", "sentenceCapture"],
            additionalProperties: false,
        },
    ],
} as const;

export const JobRequirementsResponseSchema = {
    type: "object",
    properties: {
        requirements: {
            type: "array",
            items: JobRequirementSchema,
        },
    },
    required: ["requirements"],
    additionalProperties: false,
} as const;
