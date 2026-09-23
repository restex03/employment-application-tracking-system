import { z } from "zod";

export const JobRequirementsResponseValidationSchema = z.strictObject({
    requirements: z.array(
        z.strictObject({
            name: z.string().min(1).max(300),
            description: z.string().min(1).max(500),
            sentenceCapture: z.string().min(1).max(1000),
        })
    ),
});
