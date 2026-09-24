import { z } from "zod";

export const JobRequirementsResponseValidationSchema = z.strictObject({
    requirements: z.array(
        z
            .strictObject({
                name: z.array(z.string().min(1).max(300)).min(1),
                type: z.enum(["single", "and", "or"]),
                sentenceCapture: z.string().min(1).max(1000),
            })
            // Enforced here rather than in the JSON schema: conditional JSON Schema
            // constructs (allOf/if/then) are rejected by providers such as Mistral.
            .superRefine((requirement, ctx) => {
                if (requirement.type === "single" && requirement.name.length !== 1) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["name"],
                        message: 'type "single" must have exactly one name entry',
                    });
                }

                if (requirement.type !== "single" && requirement.name.length < 2) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["name"],
                        message: 'type "and"/"or" must have at least two name entries',
                    });
                }
            })
    ),
});
