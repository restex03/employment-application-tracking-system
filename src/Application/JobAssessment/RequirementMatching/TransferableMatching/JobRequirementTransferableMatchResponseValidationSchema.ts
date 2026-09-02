import { z } from "zod";

export const JobRequirementTransferableMatchResponseValidationSchema = z.discriminatedUnion("isTransferableMatch", [
    z.strictObject({
        isTransferableMatch: z.literal(true),
        evidence: z.string().trim().min(1).max(300),
    }),
    z.strictObject({
        isTransferableMatch: z.literal(false),
        evidence: z.null(),
    }),
]);

export type JobRequirementTransferableMatchResponse = z.infer<
    typeof JobRequirementTransferableMatchResponseValidationSchema
>;
