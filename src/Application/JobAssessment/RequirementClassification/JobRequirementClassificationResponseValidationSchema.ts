import { z } from "zod";

export const JobRequirementClassificationResponseValidationSchema = z.strictObject({
    classifications: z.array(
        z.strictObject({
            index: z.number().int().nonnegative(),
            category: z.enum([
                "technical_skill",
                "technical_skill_depth",
                "domain_experience",
                "role_scope",
                "education",
                "certification",
                "other",
            ]),
        })
    ),
});
