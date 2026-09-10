import { describe, expect, it } from "vitest";

import { WorkdayDaysOldNormalizer } from "./WorkdayDaysOldNormalizer";

describe("WorkdayDaysOldNormalizer", () => {
    const normalizer = new WorkdayDaysOldNormalizer();

    it.each([
        ["00", "Posted Today"],
        ["01", "Posted Yesterday"],
        ["04", "Posted 4 Days Ago"],
        ["07", "Posted 7 Days Ago"],
        ["11", "Posted 11 Days Ago"],
        ["12", "Posted 12 Days Ago"],
        ["14", "Posted 14 Days Ago"],
        ["15", "Posted 15 Days Ago"],
        ["18", "Posted 18 Days Ago"],
        ["19", "Posted 19 Days Ago"],
        ["20", "Posted 20 Days Ago"],
        ["21", "Posted 21 Days Ago"],
        ["25", "Posted 25 Days Ago"],
        ["26", "Posted 26 Days Ago"],
        ["27", "Posted 27 Days Ago"],
        ["28", "Posted 28 Days Ago"],
        ["29", "Posted 29 Days Ago"],
        ["30+", "Posted 30+ Days Ago"],
        ["Invalid format", "Invalid format"],
        ["", ""],
    ])("returns '%s' for '%s'", (expected, postedOn) => {
        expect(normalizer.normalize(postedOn)).toBe(expected);
    });
});
