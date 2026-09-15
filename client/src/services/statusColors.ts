/**
 * Status-to-color lookup maps with no React or DOM dependencies.
 * Centralizes the color constants previously duplicated as inline switch statements
 * across JobPostsPage, JobPostModal, and ApplicationStatusModal.
 */

import { JobApplicationStatus } from "../types/JobPost";
import type { JobAssessmentStatus, JobAssessmentReviewStatus, JobScreenDisposition } from "../types/JobAssessment";
import { keyof } from "zod";

// Common colors
const GREEN = "#22c55e";
const YELLOW = "#facc15";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const GRAY = "#9ca3af";

export const applicationStatusColors: Record<JobApplicationStatus, string> = {
    [JobApplicationStatus.Applied]: BLUE,
    [JobApplicationStatus.Interview]: AMBER,
    [JobApplicationStatus.Offer]: GREEN,
    [JobApplicationStatus.Rejected]: RED,
    [JobApplicationStatus.Review]: GRAY,
};

export function getApplicationStatusColor(status: JobApplicationStatus): string {
    return applicationStatusColors[status] ?? GRAY;
}

export const assessmentStatusColors: Record<JobAssessmentStatus, string> = {
    complete: GREEN,
    incomplete: YELLOW,
    unknown: GRAY,
};

export function getAssessmentStatusColor(status: JobAssessmentStatus): string {
    return assessmentStatusColors[status] ?? GRAY;
}

export const reviewStatusColors: Record<JobAssessmentReviewStatus, string> = {
    accepted: GREEN,
    flagged: RED,
    unreviewed: YELLOW,
};

export function getUnreviewedStatusColor(status: JobAssessmentReviewStatus): string {
    const unreviewedStatus = status === "unreviewed";
    return unreviewedStatus ? reviewStatusColors.unreviewed : GRAY;
}
export function getAcceptedStatusColor(status: JobAssessmentReviewStatus): string {
    const acceptedStatus = status === "accepted";
    return acceptedStatus ? reviewStatusColors.accepted : GRAY;
}
export function getFlaggedStatusColor(status: JobAssessmentReviewStatus): string {
    const flaggedStatus = status === "flagged";
    return flaggedStatus ? reviewStatusColors.flagged : GRAY;
}

export const matchTypeColors: Record<string, string> = {
    direct: GREEN,
    transferable: YELLOW,
    missing: RED,
};

export function getMatchTypeColor(matchType: string): string {
    return matchTypeColors[matchType] ?? GRAY;
}

export const screenDispositionColors: Record<JobScreenDisposition, string> = {
    advance: GREEN,
    reject: RED,
    review: YELLOW,
};

export function getScreenDispositionColor(disposition: JobScreenDisposition): string {
    return screenDispositionColors[disposition] ?? GRAY;
}

/** Score category for the job match score indicator. */
export type ScoreCategory = "high" | "fair" | "poor" | "missing";

export function getScoreCategory(score: number | undefined): ScoreCategory {
    if (score === undefined) return "missing";
    if (score >= 75) return "high";
    if (score >= 50) return "fair";
    return "poor";
}
