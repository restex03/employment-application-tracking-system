import { describe, expect, it, vi } from "vitest";

import { WorkdayJobsResponseMapper } from "./WorkdayJobsApiResponseMapper";
import { IWorkdayJobsApiResponse } from "../Contracts/IWorkdayJobsApiResponse";
import { ILogger } from "../../../Logging/ILogger";

function createLogger(): ILogger {
    return {
        table: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
}

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
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const response = createPosting();

        const result = mapper.map(response);

        expect(result).toEqual({
            sourceId: jobSourceId,
            requisitionId: "R-51887",
            title: "Senior Software Engineer",
            detailPath: "/job/USA-GA-Atlanta/Senior-Software-Engineer_R-51887",
            locations: ["Atlanta, GA"],
            daysOld: "02",
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
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const response = createPosting({ externalPath });

        const result = mapper.map(response);

        expect(result!.requisitionId).toBe(expectedRequisitionId);
    });

    it("extracts JR-prefixed requisition IDs containing a hyphen", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const externalPath = "/job/USA-CA-Pleasanton/Senior-Software-Engineer_JR-0107919";

        const response = createPosting({ externalPath });

        const result = mapper.map(response);

        expect(result!.requisitionId).toBe("JR-0107919");
    });

    it("falls back to externalPath when a requisition ID cannot be determined", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const externalPath = "/job/USA-GA-Atlanta/Some-Unusual-Job";

        const response = createPosting({ externalPath });

        const result = mapper.map(response);

        expect(result!.requisitionId).toBe(externalPath);
    });

    it("omits locations when locationsText is empty", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const result = mapper.map(createPosting({ locationsText: "" }));

        expect(result!.locations).toBeUndefined();
    });

    it("omits postedDate when daysOld is empty", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const result = mapper.map(createPosting({ postedOn: "" }));

        expect(result!.daysOld).toBeUndefined();
    });

    it("returns null when title is missing", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const result = mapper.map(createPosting({ title: undefined as unknown as string }));

        expect(result).toBeNull();
    });

    it("returns null when externalPath is missing", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const result = mapper.map(createPosting({ externalPath: undefined as unknown as string }));

        expect(result).toBeNull();
    });

    it("returns null when both title and externalPath are missing", () => {
        const mapper = new WorkdayJobsResponseMapper(jobSourceId, createLogger());

        const result = mapper.map(
            createPosting({
                title: undefined as unknown as string,
                externalPath: undefined as unknown as string,
            })
        );

        expect(result).toBeNull();
    });
});
