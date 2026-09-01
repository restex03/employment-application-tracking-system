import { z } from "zod";

export const JobRequirementsResponseValidationSchema = z.strictObject({
    requirements: z.array(
        z.strictObject({
            area: z.string().min(1),
            description: z.string().min(1),
        })
    ),
});
