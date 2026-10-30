import { describe, expect, it } from "vitest";
import {
    cycleSortDirection,
    getSortIndicator,
    compareNumeric,
    compareStrings,
    compareDates,
} from "./sortHelpers";

describe("cycleSortDirection", () => {
    it("cycles null -> asc -> desc -> null", () => {
        expect(cycleSortDirection(null)).toBe("asc");
        expect(cycleSortDirection("asc")).toBe("desc");
        expect(cycleSortDirection("desc")).toBe(null);
    });
});

describe("getSortIndicator", () => {
    it("returns null when column is not the active sort column", () => {
        expect(getSortIndicator("company", "title", "asc")).toBeNull();
    });

    it("returns null when direction is null", () => {
        expect(getSortIndicator("company", "company", null)).toBeNull();
    });

    it("returns up arrow for asc", () => {
        expect(getSortIndicator("company", "company", "asc")).toBe(" \u2191");
    });

    it("returns down arrow for desc", () => {
        expect(getSortIndicator("company", "company", "desc")).toBe(" \u2193");
    });
});

describe("compareNumeric", () => {
    it("compares ascending", () => {
        expect(compareNumeric(1, 2, "asc")).toBe(-1);
        expect(compareNumeric(2, 1, "asc")).toBe(1);
        expect(compareNumeric(1, 1, "asc")).toBe(0);
    });

    it("compares descending", () => {
        expect(compareNumeric(1, 2, "desc")).toBe(1);
        expect(compareNumeric(2, 1, "desc")).toBe(-1);
    });

    it("returns 0 for null direction", () => {
        expect(compareNumeric(1, 2, null)).toBe(0);
    });
});

describe("compareStrings", () => {
    it("compares ascending case-insensitive", () => {
        expect(compareStrings("apple", "Banana", "asc")).toBeLessThan(0);
        expect(compareStrings("Banana", "apple", "asc")).toBeGreaterThan(0);
    });

    it("compares descending", () => {
        expect(compareStrings("apple", "Banana", "desc")).toBeGreaterThan(0);
    });

    it("returns 0 for null direction", () => {
        expect(compareStrings("a", "b", null)).toBe(0);
    });
});

describe("compareDates", () => {
    it("compares timestamps rather than ISO string order", () => {
        expect(compareDates("2026-10-30T12:00:00+03:00", "2026-10-30T10:00:00Z", "asc")).toBeLessThan(0);
        expect(compareDates("2026-10-30T12:00:00+03:00", "2026-10-30T10:00:00Z", "desc")).toBeGreaterThan(0);
    });

    it.each(["asc", "desc"] as const)("keeps missing and invalid dates last when %s", direction => {
        for (const missing of [undefined, null, "", "invalid"]) {
            expect(compareDates(missing, "2026-10-30T00:00:00Z", direction)).toBeGreaterThan(0);
            expect(compareDates("2026-10-30T00:00:00Z", missing, direction)).toBeLessThan(0);
            expect(compareDates(missing, undefined, direction)).toBe(0);
        }
    });

    it("returns zero for equal instants and inactive sorting", () => {
        expect(compareDates("2026-10-30T12:00:00+03:00", "2026-10-30T09:00:00Z", "asc")).toBe(0);
        expect(compareDates(undefined, "2026-10-30T00:00:00Z", null)).toBe(0);
    });
});
