import { describe, expect, it } from "vitest";
import { postedDateSince } from "./postedDateFilters";

describe("postedDateSince", () => {
    it.each([0, 1, 7, 14, 21, 30])("returns local midnight %i calendar days ago as ISO", daysAgo => {
        const now = new Date(2026, 9, 30, 14, 50, 38);
        const expected = new Date(2026, 9, 30 - daysAgo);

        expect(postedDateSince(daysAgo, now)).toBe(expected.toISOString());
        expect(now.getHours()).toBe(14);
    });

    it.each([
        [2026, 2, 9],
        [2026, 10, 2],
        [2026, 0, 1],
    ])("preserves midnight across DST and calendar boundaries (%i-%i-%i)", (year, month, day) => {
        const now = new Date(year, month, day, 15);
        const cutoff = new Date(postedDateSince(1, now));

        expect(cutoff.getTime()).toBe(new Date(year, month, day - 1).getTime());
        expect(cutoff.getHours()).toBe(0);
    });
});
