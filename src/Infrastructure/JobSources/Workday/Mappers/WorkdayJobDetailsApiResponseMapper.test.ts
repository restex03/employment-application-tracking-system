import { describe, expect, it } from "vitest";

import { WorkdayJobDetailsApiResponseMapper } from "./WorkdayJobDetailsApiResponseMapper";
import { IWorkdayJobDetailsApiResponse, IWorkdayJobPostingInfo } from "../Contracts/IWorkdayJobDetailsApiResponse";

function createResponse(jobPostingOverrides: Partial<IWorkdayJobPostingInfo> = {}): IWorkdayJobDetailsApiResponse {
    return {
        jobPostingInfo: {
            id: "JR-0107919",
            title: "Senior Software Engineer",
            jobDescription: "<p>Build great software.</p>",

            location: "USA, CA, Pleasanton",
            additionalLocations: [],

            postedOn: "Posted 2 Days Ago",
            startDate: "2026-08-01",
            timeType: "Full time",

            jobReqId: "JR-0107919",
            jobPostingId: "abc123",
            jobPostingSiteId: "site123",

            country: {
                descriptor: "United States of America",
                id: "bc33aa3152ec42d4995f4791a106ed09",
            },

            externalUrl: "https://example.com/job/JR-0107919",

            ...jobPostingOverrides,
        },

        hiringOrganization: {
            name: "Workday",
            url: "https://workday.com",
        },
    };
}

describe("WorkdayJobDetailsApiResponseMapper", () => {
    it("maps a Workday job detail response", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const result = mapper.map(createResponse());

        expect(result).toEqual({
            id: "JR-0107919",
            requisitionId: "JR-0107919",
            title: "Senior Software Engineer",
            description: "<p>Build great software.</p>",
            company: "Workday",
            datePosted: "Posted 2 Days Ago",
            employmentType: "Full time",
            locations: [
                {
                    city: "USA, CA, Pleasanton",
                    country: "United States of America",
                },
            ],
        });
    });

    it("maps additional locations", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const response = createResponse({
            location: "Atlanta, GA",
            additionalLocations: ["Hartford, CT", "St. Paul, MN", "Hunt Valley, MD"],
        });

        const result = mapper.map(response);

        expect(result.locations).toEqual([
            {
                city: "Atlanta, GA",
                country: "United States of America",
            },
            {
                city: "Hartford, CT",
            },
            {
                city: "St. Paul, MN",
            },
            {
                city: "Hunt Valley, MD",
            },
        ]);
    });

    it("handles missing additionalLocations", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const response = createResponse({
            additionalLocations: undefined,
        });

        const result = mapper.map(response);

        expect(result.locations).toEqual([
            {
                city: "USA, CA, Pleasanton",
                country: "United States of America",
            },
        ]);
    });

    it("does not add a primary location when location is empty", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const response = createResponse({
            location: "",
            additionalLocations: ["Austin, TX"],
        });

        const result = mapper.map(response);

        expect(result.locations).toEqual([
            {
                city: "Austin, TX",
            },
        ]);
    });

    it("filters empty additional locations", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const response = createResponse({
            additionalLocations: ["", "Austin, TX", "", "New York, NY"],
        });

        const result = mapper.map(response);

        expect(result.locations).toEqual([
            {
                city: "USA, CA, Pleasanton",
                country: "United States of America",
            },
            {
                city: "Austin, TX",
            },
            {
                city: "New York, NY",
            },
        ]);
    });

    it("deduplicates identical additional locations", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const response = createResponse({
            additionalLocations: ["Austin, TX", "Austin, TX", "New York, NY", "Austin, TX"],
        });

        const result = mapper.map(response);

        expect(result.locations).toEqual([
            {
                city: "USA, CA, Pleasanton",
                country: "United States of America",
            },
            {
                city: "Austin, TX",
            },
            {
                city: "New York, NY",
            },
        ]);
    });

    it("preserves mapped job fields independently of unused Workday fields", () => {
        const mapper = new WorkdayJobDetailsApiResponseMapper();

        const response = createResponse({
            startDate: "2099-01-01",
            jobPostingId: "different-posting-id",
            jobPostingSiteId: "different-site-id",
            externalUrl: "https://different.example.com",
        });

        const result = mapper.map(response);

        expect(result.id).toBe("JR-0107919");
        expect(result.requisitionId).toBe("JR-0107919");
        expect(result.title).toBe("Senior Software Engineer");
        expect(result.company).toBe("Workday");
    });
});
