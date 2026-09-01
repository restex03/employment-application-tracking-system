import { z } from "zod";

const JobRequirementSchema = z.strictObject({
    area: z.string().min(1),
    category: z.enum([
        "technical_skill",
        "technical_skill_depth",
        "domain_experience",
        "role_scope",
        "education",
        "certification",
        "other",
    ]),
    description: z.string().min(1),
});

export const JobRequirementsResponseValidationSchema = z.strictObject({
    requirements: z.array(JobRequirementSchema),
});
