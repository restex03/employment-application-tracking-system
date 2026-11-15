import { z } from "zod";

const DirectMatchSchema = z.strictObject({
    matchType: z.literal("direct"),
    evidence: z.string().min(1),
});

const TransferableMatchSchema = z.strictObject({
    matchType: z.literal("transferable"),
    evidence: z.string().min(1),
});

const MissingMatchSchema = z.strictObject({
    matchType: z.literal("missing"),
    evidence: z.null(),
});

export const JobRequirementMatchingResponseValidationSchema = z.discriminatedUnion("matchType", [
    DirectMatchSchema,
    TransferableMatchSchema,
    MissingMatchSchema,
]);
