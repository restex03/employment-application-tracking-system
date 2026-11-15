import { describe, expect, it } from "vitest";
import {
    assessmentJobParamsSchema,
    attachmentBodySchema,
    attachmentDownloadParamsSchema,
    attachmentHeadersSchema,
    candidateProfileBodySchema,
    jobApplicationStatusBodySchema,
    jobAssessmentParamsSchema,
    jobAssessmentReviewBodySchema,
    jobPostSyncBodySchema,
    jobSourceParamsSchema,
    jobSourceQuerySchema,
} from "./ApiRouteSchemas";

describe("API route schemas", () => {
    it("validates source query and path parameters", () => {
        expect(jobSourceQuerySchema.safeParse({ companyName: "Example" }).success).toBe(true);
        expect(jobSourceQuerySchema.safeParse({ companyName: ["Example"] }).success).toBe(false);
        expect(jobSourceParamsSchema.safeParse({ sourceId: "" }).success).toBe(false);
    });

    it("validates nested candidate profile data", () => {
        expect(
            candidateProfileBodySchema.safeParse({
                id: "profile-1",
                totalYearsExperience: 5,
                workAuthorization: {
                    citizenshipCountry: "US",
                    authorizedToWorkInUS: true,
                    requiresSponsorship: false,
                },
                education: [],
                skills: [
                    {
                        name: "TypeScript",
                        category: "language",
                        level: "strong",
                    },
                ],
                experience: [],
                strengths: [],
                preferences: {
                    workArrangements: ["remote"],
                    locations: [],
                    compensation: {},
                },
                constraints: {},
            }).success
        ).toBe(true);
        expect(candidateProfileBodySchema.safeParse({ id: "profile-1" }).success).toBe(false);
    });

    it("defaults omitted sync source IDs and rejects malformed IDs", () => {
        expect(jobPostSyncBodySchema.parse({})).toEqual({ sourceIds: [] });
        expect(jobPostSyncBodySchema.safeParse({ sourceIds: [""] }).success).toBe(false);
    });

    it("validates application status and assessment review payloads", () => {
        expect(jobApplicationStatusBodySchema.safeParse({ status: "APPLIED", notes: "" }).success).toBe(true);
        expect(jobApplicationStatusBodySchema.safeParse({ status: "invalid" }).success).toBe(false);
        expect(jobAssessmentReviewBodySchema.safeParse({ reviewStatus: "accepted" }).success).toBe(true);
        expect(jobAssessmentReviewBodySchema.safeParse({ reviewStatus: "unknown" }).success).toBe(false);
    });

    it("validates assessment, queue, and attachment path parameters", () => {
        expect(
            jobAssessmentParamsSchema.safeParse({
                jobPostId: "job-1",
                candidateProfileId: "profile-1",
            }).success
        ).toBe(true);
        expect(assessmentJobParamsSchema.safeParse({ queueJobId: "" }).success).toBe(false);
        expect(
            attachmentDownloadParamsSchema.safeParse({
                id: "application-1",
                attachmentId: "",
            }).success
        ).toBe(false);
    });

    it("requires attachment metadata and a non-empty binary body", () => {
        expect(attachmentHeadersSchema.safeParse({ "x-file-name": "resume.pdf" }).success).toBe(true);
        expect(attachmentHeadersSchema.safeParse({}).success).toBe(false);
        expect(attachmentBodySchema.safeParse(Buffer.from("file")).success).toBe(true);
        expect(attachmentBodySchema.safeParse(Buffer.alloc(0)).success).toBe(false);
    });
});
