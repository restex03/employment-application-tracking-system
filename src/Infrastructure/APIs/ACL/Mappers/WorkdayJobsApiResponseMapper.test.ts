import { describe, expect, it } from "vitest";

import { WorkdayJobsResponseMapper } from "./WorkdayJobsApiResponseMapper";
import { IWorkdayJobsResponse } from "../ApiContracts/IWorkdayJobsResponse";

function createResponse(jobPostings: IWorkdayJobsResponse["jobPostings"]): IWorkdayJobsResponse {
    return {
        total: jobPostings.length,
        jobPostings,
        facets: [],
        userAuthenticated: false,
    };
}

function createPosting(
    overrides: Partial<IWorkdayJobsResponse["jobPostings"][number]> = {}
): IWorkdayJobsResponse["jobPostings"][number] {
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
    const companyName = "Travelers";

    it("maps Workday job postings to job search results", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const response = createResponse([createPosting()]);

        const result = mapper.map(response);

        expect(result).toEqual([
            {
                id: "R-51887",
                requisitionId: "R-51887",
                title: "Senior Software Engineer",
                company: companyName,
                detailPath: "/job/USA-GA-Atlanta/Senior-Software-Engineer_R-51887",
                locations: ["Atlanta, GA"],
                postedDate: "Posted 2 Days Ago",
            },
        ]);
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
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const [result] = mapper.map(createResponse([createPosting({ externalPath })]));

        expect(result.requisitionId).toBe(expectedRequisitionId);
        expect(result.id).toBe(expectedRequisitionId);
    });

    it("extracts JR-prefixed requisition IDs containing a hyphen", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const externalPath = "/job/USA-CA-Pleasanton/Senior-Software-Engineer_JR-0107919";

        const [result] = mapper.map(createResponse([createPosting({ externalPath })]));

        expect(result.requisitionId).toBe("JR-0107919");
        expect(result.id).toBe("JR-0107919");
    });

    it("falls back to externalPath when a requisition ID cannot be determined", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const externalPath = "/job/USA-GA-Atlanta/Some-Unusual-Job";

        const [result] = mapper.map(createResponse([createPosting({ externalPath })]));

        expect(result.id).toBe(externalPath);
        expect(result.requisitionId).toBeUndefined();
    });

    it("omits locations when locationsText is empty", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const [result] = mapper.map(
            createResponse([
                createPosting({
                    locationsText: "",
                }),
            ])
        );

        expect(result.locations).toBeUndefined();
    });

    it("omits postedDate when postedOn is empty", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const [result] = mapper.map(
            createResponse([
                createPosting({
                    postedOn: "",
                }),
            ])
        );

        expect(result.postedDate).toBeUndefined();
    });

    it("maps multiple postings", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const response = createResponse([
            createPosting({
                title: "Software Engineer",
                externalPath: "/job/test/Software-Engineer_R100",
            }),
            createPosting({
                title: "Senior Software Engineer",
                externalPath: "/job/test/Senior-Software-Engineer_R101",
            }),
        ]);

        const result = mapper.map(response);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("R100");
        expect(result[1].id).toBe("R101");
    });

    it("returns an empty collection when there are no postings", () => {
        const mapper = new WorkdayJobsResponseMapper(companyName);

        const result = mapper.map(createResponse([]));

        expect(result).toEqual([]);
    });
});
