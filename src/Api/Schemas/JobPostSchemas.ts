import { z } from "zod";
import { jobPostSortFields } from "../../Application/JobPost/IJobPostService";

const positiveIntegerQueryParameter = (defaultValue: number) =>
    z.preprocess(value => (value === "" ? undefined : value), z.coerce.number().int().min(1).default(defaultValue));

const postedDateString = z.string().trim().meta({ format: "date-time" });

export const jobPostQuerySchema = z.object({
    pageCount: positiveIntegerQueryParameter(10),
    pageNumber: positiveIntegerQueryParameter(1),
    companyName: z
        .string()
        .optional()
        .transform(value => value?.trim() ?? ""),
    requisitionId: z
        .string()
        .optional()
        .transform(value => value?.trim() ?? ""),
    title: z
        .string()
        .optional()
        .transform(value => value?.trim() ?? ""),
    location: z
        .string()
        .optional()
        .transform(value => value?.trim() ?? ""),
    postedDate: postedDateString
        .optional()
        .refine(
            value => !value || z.iso.datetime({ offset: true }).safeParse(value).success,
            "postedDate must be an ISO 8601 timestamp with a timezone."
        )
        .transform(value => value || undefined),
    jobMatchScore: z
        .string()
        .optional()
        .transform(value => {
            const trimmedValue = value?.trim();
            if (!trimmedValue) {
                return undefined;
            }

            const score = Number(trimmedValue);
            return Number.isNaN(score) ? undefined : score;
        }),
    applicationStatus: z
        .string()
        .optional()
        .transform(value => value?.trim() || undefined),
    sortBy: z.enum(jobPostSortFields).default("postedDate"),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const jobPostParamsSchema = z.object({
    jobPostId: z.string().min(1),
});
