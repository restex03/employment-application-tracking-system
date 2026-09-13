import { describe, expect, it } from "vitest";
import { JobApplicationStatus } from "../types/JobPost";
import {
    getApplicationStatusColor,
    getAssessmentStatusColor,
    getReviewStatusColor,
    getMatchTypeColor,
    getScreenDispositionColor,
    getScoreCategory,
} from "./statusColors";

describe("getApplicationStatusColor", () => {
    it("returns a color for each application status", () => {
        expect(getApplicationStatusColor(JobApplicationStatus.Applied)).toBe("#3b82f6");
        expect(getApplicationStatusColor(JobApplicationStatus.Interview)).toBe("#f59e0b");
        expect(getApplicationStatusColor(JobApplicationStatus.Offer)).toBe("#22c55e");
        expect(getApplicationStatusColor(JobApplicationStatus.Rejected)).toBe("#ef4444");
        expect(getApplicationStatusColor(JobApplicationStatus.Review)).toBe("#9ca3af");
    });
});

describe("getAssessmentStatusColor", () => {
    it("returns a color for each assessment status", () => {
        expect(getAssessmentStatusColor("complete")).toBe("#22c55e");
        expect(getAssessmentStatusColor("incomplete")).toBe("#facc15");
        expect(getAssessmentStatusColor("unknown")).toBe("#9ca3af");
    });
});

describe("getReviewStatusColor", () => {
    it("returns a color for each review status", () => {
        expect(getReviewStatusColor("accepted")).toBe("#22c55e");
        expect(getReviewStatusColor("flagged")).toBe("#ef4444");
        expect(getReviewStatusColor("unreviewed")).toBe("#9ca3af");
    });
});

describe("getMatchTypeColor", () => {
    it("returns a color for each match type", () => {
        expect(getMatchTypeColor("direct")).toBe("#22c55e");
        expect(getMatchTypeColor("transferable")).toBe("#facc15");
        expect(getMatchTypeColor("missing")).toBe("#ef4444");
    });

    it("returns gray for unknown match type", () => {
        expect(getMatchTypeColor("unknown")).toBe("#9ca3af");
    });
});

describe("getScreenDispositionColor", () => {
    it("returns a color for each disposition", () => {
        expect(getScreenDispositionColor("advance")).toBe("#22c55e");
        expect(getScreenDispositionColor("reject")).toBe("#ef4444");
        expect(getScreenDispositionColor("review")).toBe("#facc15");
    });
});

describe("getScoreCategory", () => {
    it("returns missing for undefined", () => {
        expect(getScoreCategory(undefined)).toBe("missing");
    });

    it("returns high for scores >= 75", () => {
        expect(getScoreCategory(75)).toBe("high");
        expect(getScoreCategory(100)).toBe("high");
    });

    it("returns fair for scores >= 50 and < 75", () => {
        expect(getScoreCategory(50)).toBe("fair");
        expect(getScoreCategory(74)).toBe("fair");
    });

    it("returns poor for scores < 50", () => {
        expect(getScoreCategory(49)).toBe("poor");
        expect(getScoreCategory(0)).toBe("poor");
    });
});
