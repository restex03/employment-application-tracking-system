import { describe, expect, it } from "vitest";
import { formatDate, formatLocation, formatLocations, formatList } from "./formatters";

describe("formatDate", () => {
    it("formats a date string as date-only by default", () => {
        const result = formatDate("2026-01-15T10:30:00Z");
        expect(result).toMatch(/Jan.*15.*2026/);
    });

    it("formats as datetime when specified", () => {
        const result = formatDate("2026-01-15T10:30:00Z", "datetime");
        expect(result).toMatch(/Jan.*15.*2026/);
        expect(result.length).toBeGreaterThan(10);
    });

    it("formats as datetimeSeconds when specified", () => {
        const result = formatDate("2026-01-15T10:30:45Z", "datetimeSeconds");
        expect(result).toMatch(/Jan.*15.*2026/);
        expect(result.length).toBeGreaterThan(15);
    });

    it("returns fallback for undefined input", () => {
        expect(formatDate(undefined)).toBe("N/A");
        expect(formatDate(undefined, "date", "--")).toBe("--");
    });

    it("returns fallback for null input", () => {
        expect(formatDate(null)).toBe("N/A");
    });

    it("returns fallback for empty string", () => {
        expect(formatDate("")).toBe("N/A");
    });
});

describe("formatLocation", () => {
    it("extracts city, state, country from an object", () => {
        expect(formatLocation({ city: "Austin", state: "TX", country: "USA" })).toBe("Austin, TX, USA");
    });

    it("filters out missing parts", () => {
        expect(formatLocation({ city: "Austin", state: "TX" })).toBe("Austin, TX");
        expect(formatLocation({ country: "USA" })).toBe("USA");
    });

    it("returns Unknown for an empty object", () => {
        expect(formatLocation({})).toBe("Unknown");
    });

    it("passes through string locations", () => {
        expect(formatLocation("Remote")).toBe("Remote");
    });

    it("stringifies non-object primitives", () => {
        expect(formatLocation(42)).toBe("42");
    });
});

describe("formatLocations", () => {
    it("joins multiple locations with semicolons", () => {
        const result = formatLocations([
            { city: "Austin", state: "TX" },
            { city: "Denver", state: "CO" },
        ]);
        expect(result).toBe("Austin, TX; Denver, CO");
    });

    it("returns fallback for empty array", () => {
        expect(formatLocations([])).toBe("N/A");
        expect(formatLocations(undefined)).toBe("N/A");
    });

    it("returns fallback for undefined", () => {
        expect(formatLocations(undefined, "--")).toBe("--");
    });

    it("handles string locations", () => {
        expect(formatLocations(["Remote", "Hybrid"])).toBe("Remote; Hybrid");
    });
});

describe("formatList", () => {
    it("joins all items when within maxItems", () => {
        expect(formatList(["a", "b", "c"], 3)).toBe("a, b, c");
    });

    it("truncates and appends count when exceeding maxItems", () => {
        expect(formatList(["a", "b", "c", "d", "e"], 3)).toBe("a, b, c, +2 more");
    });

    it("joins all when maxItems is not specified", () => {
        expect(formatList(["a", "b", "c"])).toBe("a, b, c");
    });

    it("returns fallback for empty or undefined", () => {
        expect(formatList([])).toBe("N/A");
        expect(formatList(undefined)).toBe("N/A");
        expect(formatList(undefined, 3, "--")).toBe("--");
    });
});
