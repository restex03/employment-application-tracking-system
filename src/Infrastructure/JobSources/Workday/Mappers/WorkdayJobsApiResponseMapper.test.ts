import { describe, expect, it } from "vitest";

import { WorkdayJobsResponseMapper } from "./WorkdayJobsApiResponseMapper";
import { IWorkdayJobsApiResponse } from "../Contracts/IWorkdayJobsApiResponse";

function createResponse(jobPostings: IWorkdayJobsApiResponse["jobPostings"]): IWorkdayJobsApiResponse {
    return {
        total: jobPostings.length,
        jobPostings,
        facets: [],
        userAuthenticated: false,
    };
}

function createPosting(
    overrides: Partial<IWorkdayJobsApiResponse["jobPostings"][number]> = {}
): IWorkdayJobsApiResponse["jobPostings"][number] {
    return {
        title: "Senior Software Engineer",
        externalPath: "/job/USA-GA-Atlanta/Senior-Software-Engineer_R-51887",
        locationsText: "Atlanta, GA",
        postedOn: "Posted 2 Days Ago",
        bulletFields: ["R-51887"],
        ...overrides,
    };
}

describe("WorkdayJobsResponseMapper", () => {
    const jobSourceId = "job-source-abc";

    it("maps Workday job postings to job search results", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        const response = createPosting();

        const result = mapper.map(response);

        expect(result).toEqual({
            sourceId: jobSourceId,
            requisitionId: "R-51887",
            title: "Senior Software Engineer",
            detailPath: "/job/USA-GA-Atlanta/Senior-Software-Engineer_R-51887",
            locations: ["Atlanta, GA"],
            postedDaysAgo: "2",
        });
    });

    it.each([
        ["/job/test/Software-Engineer_R-51887", "R-51887"],
        ["/job/test/Software-Engineer_R29506", "R29506"],
        ["/job/test/Software-Engineer_J00178249", "J00178249"],
        ["/job/test/Software-Engineer_P751057", "P751057"],
        ["/job/test/Software-Engineer_26WD99323", "26WD99323"],
        ["/job/test/Software-Engineer_2021114", "2021114"],
        ["/job/test/Software-Engineer_J00177610-1", "J00177610"],
    ])("extracts requisition ID from %s", (externalPath, expectedRequisitionId) => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        const response = createPosting({ externalPath });

        const result = mapper.map(response);

        expect(result.requisitionId).toBe(expectedRequisitionId);
    });

    it("extracts JR-prefixed requisition IDs containing a hyphen", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        const externalPath = "/job/USA-CA-Pleasanton/Senior-Software-Engineer_JR-0107919";

        const response = createPosting({ externalPath });

        const result = mapper.map(response);

        expect(result.requisitionId).toBe("JR-0107919");
    });

    it("falls back to externalPath when a requisition ID cannot be determined", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        const externalPath = "/job/USA-GA-Atlanta/Some-Unusual-Job";

        const response = createPosting({ externalPath });

        const result = mapper.map(response);

        expect(result.requisitionId).toBe(externalPath);
    });

    it("omits locations when locationsText is empty", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        const result = mapper.map(createPosting({ locationsText: "" }));

        expect(result.locations).toBeUndefined();
    });

    it("omits postedDate when postedDaysAgo is empty", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        const result = mapper.map(createPosting({ postedOn: "" }));

        expect(result.postedDaysAgo).toBeUndefined();
    });

    describe("normalizeDaysAgo", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId);

        it("returns '0' for 'Posted Today'", () => {
            const result = mapper.normalizeDaysAgo("Posted Today");

            expect(result).toBe("0");
        });

        it.each([
            ["4", "Posted 4 Days Ago"],
            ["7", "Posted 7 Days Ago"],
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
        ])("returns '%s' for '%s'", (expected, postedDaysAgo) => {
            const result = mapper.normalizeDaysAgo(postedDaysAgo);

            expect(result).toBe(expected);
        });

        it("returns '30+' for 'Posted 30+ Days Ago'", () => {
            const result = mapper.normalizeDaysAgo("Posted 30+ Days Ago");

            expect(result).toBe("30+");
        });

        it("returns 'Unknown' for unrecognized format", () => {
            const result = mapper.normalizeDaysAgo("Invalid format");

            expect(result).toBe("Unknown");
        });

        it("returns 'Unknown' for empty string", () => {
            const result = mapper.normalizeDaysAgo("");

            expect(result).toBe("Unknown");
        });
    });
});
