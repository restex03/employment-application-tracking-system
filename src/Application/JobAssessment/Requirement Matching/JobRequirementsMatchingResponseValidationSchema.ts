import { z } from "zod";

const DirectMatchSchema = z.strictObject({
    index: z.number().int().nonnegative(),
    matchType: z.literal("direct"),
    evidence: z.string().min(1),
});

const TransferableMatchSchema = z.strictObject({
    index: z.number().int().nonnegative(),
    matchType: z.literal("transferable"),
    evidence: z.string().min(1),
});

const MissingMatchSchema = z.strictObject({
    index: z.number().int().nonnegative(),
    matchType: z.literal("missing"),
    evidence: z.null(),
});

export const JobRequirementsMatchingResponseValidationSchema = z.strictObject({
    matches: z.array(
        z.discriminatedUnion("matchType", [DirectMatchSchema, TransferableMatchSchema, MissingMatchSchema])
    ),
});
