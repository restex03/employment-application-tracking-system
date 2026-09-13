import { describe, expect, it } from "vitest";
import {
    cycleSortDirection,
    getSortIndicator,
    compareNumeric,
    compareStrings,
    daysOldToSortableNumber,
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

describe("daysOldToSortableNumber", () => {
    it("returns Infinity for undefined", () => {
        expect(daysOldToSortableNumber(undefined)).toBe(Infinity);
    });

    it("returns Infinity for Unknown", () => {
        expect(daysOldToSortableNumber("Unknown")).toBe(Infinity);
    });

    it("returns 1000 for 30+", () => {
        expect(daysOldToSortableNumber("30+")).toBe(1000);
    });

    it("parses numeric strings", () => {
        expect(daysOldToSortableNumber("5")).toBe(5);
        expect(daysOldToSortableNumber("15")).toBe(15);
    });
});
