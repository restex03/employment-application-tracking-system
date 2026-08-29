import { z } from "zod";

export const JobScreeningResponseValidationSchema = z.object({
    disposition: z.enum(["advance", "reject", "review"]),
    reason: z.string().max(100),
});
