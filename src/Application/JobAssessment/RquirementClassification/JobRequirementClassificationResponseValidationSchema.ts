import { z } from "zod";

const ClassifiedJobRequirementSchema = z.strictObject({
    area: z.string().min(1),
    description: z.string().min(1),
    category: z.enum([
        "technical_skill",
        "technical_skill_depth",
        "domain_experience",
        "role_scope",
        "education",
        "certification",
        "other",
    ]),
});

export const JobRequirementClassificationResponseValidationSchema = z.strictObject({
    requirements: z.array(ClassifiedJobRequirementSchema),
});
