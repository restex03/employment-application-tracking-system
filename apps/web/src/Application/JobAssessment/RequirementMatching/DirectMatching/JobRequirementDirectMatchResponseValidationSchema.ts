import { z } from "zod";

export const JobRequirementDirectMatchResponseValidationSchema = z.discriminatedUnion("isDirectMatch", [
    z.strictObject({
        isDirectMatch: z.literal(true),
        evidence: z.string().trim().min(1).max(300),
    }),
    z.strictObject({
        isDirectMatch: z.literal(false),
        evidence: z.null(),
    }),
]);

export type JobRequirementDirectMatchResponse = z.infer<typeof JobRequirementDirectMatchResponseValidationSchema>;
