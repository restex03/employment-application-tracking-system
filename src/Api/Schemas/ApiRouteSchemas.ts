import { z } from "zod";
import { JobApplicationStatus } from "../../Domain/JobApplications/IJobApplication";

const nonEmptyString = z.string().min(1);

export const jobSourceQuerySchema = z.object({
    companyName: z.string().optional(),
});

export const jobSourceParamsSchema = z.object({
    sourceId: nonEmptyString,
});

export const candidateProfileParamsSchema = z.object({
    id: nonEmptyString,
});

const skillSchema = z.object({
    name: z.string(),
    category: z.enum([
        "language",
        "framework",
        "cloud",
        "database",
        "messaging",
        "devops",
        "architecture",
        "ai",
        "security",
        "testing",
        "observability",
        "domain",
        "tool",
        "other",
    ]),
    level: z.enum(["expert", "strong", "working", "exposure", "learning"]),
    years: z.number().optional(),
    productionExperience: z.boolean().optional(),
    context: z.string().optional(),
});

export const candidateProfileBodySchema = z.object({
    id: nonEmptyString,
    currentTitle: z.string().optional(),
    totalYearsExperience: z.number(),
    workAuthorization: z.object({
        citizenshipCountry: z.string(),
        authorizedToWorkInUS: z.boolean(),
        requiresSponsorship: z.boolean(),
    }),
    education: z.array(
        z.object({
            degreeType: z.enum(["associate", "bachelor", "master", "doctorate", "other"]),
            field: z.string(),
            institution: z.string().optional(),
            completed: z.boolean(),
        })
    ),
    skills: z.array(skillSchema),
    experience: z.array(
        z.object({
            title: z.string(),
            company: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            current: z.boolean().optional(),
            highlights: z.array(z.string()),
            domains: z.array(z.string()).optional(),
        })
    ),
    strengths: z.array(z.string()),
    preferences: z.object({
        workArrangements: z.array(z.enum(["remote", "hybrid", "onsite", "unknown"])),
        locations: z.array(
            z.object({
                city: z.string().optional(),
                state: z.string().optional(),
                country: z.string(),
                maxCommuteMinutes: z.number().optional(),
            })
        ),
        compensation: z.object({
            minimumBaseSalary: z.number().optional(),
            targetBaseSalary: z.number().optional(),
            considerVariableCompensation: z.boolean().optional(),
        }),
        employmentTypes: z
            .array(z.enum(["full_time", "part_time", "contract", "temporary", "internship", "unknown"]))
            .optional(),
    }),
    constraints: z.object({
        requiresRemoteOrApprovedHybridLocation: z.boolean().optional(),
        requiresSponsorship: z.boolean().optional(),
        hardConstraints: z.array(z.string()).optional(),
    }),
});

export const jobPostSyncBodySchema = z.object({
    sourceIds: z.array(nonEmptyString).default([]),
    searchText: z.string().optional(),
});

export const jobApplicationParamsSchema = z.object({
    id: nonEmptyString,
});

export const jobApplicationByJobParamsSchema = z.object({
    jobId: nonEmptyString,
});

export const jobApplicationStatusBodySchema = z.object({
    status: z.enum(JobApplicationStatus),
    notes: z.string().optional(),
});

export const attachmentParamsSchema = z.object({
    id: nonEmptyString,
});

export const attachmentDownloadParamsSchema = z.object({
    id: nonEmptyString,
    attachmentId: nonEmptyString,
});

export const attachmentHeadersSchema = z.object({
    "x-file-name": nonEmptyString,
});

export const attachmentBodySchema = z
    .unknown()
    .refine((value): value is Buffer => Buffer.isBuffer(value) && value.length > 0, "File content is required.");

export const jobAssessmentParamsSchema = z.object({
    jobPostId: nonEmptyString,
    candidateProfileId: nonEmptyString,
});

export const jobAssessmentReviewBodySchema = z.object({
    reviewStatus: z.enum(["unreviewed", "accepted", "flagged"]),
});

export const assessmentJobParamsSchema = z.object({
    queueJobId: nonEmptyString,
});
