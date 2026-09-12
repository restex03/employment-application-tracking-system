import { describe, expect, it } from "vitest";
import { JobLinkMapper } from "./SqliteJobQueries";

const createJobPostRow = (browserBaseUrl: string, detailPath: string) => ({
    id: "job-1",
    source_id: "source-1",
    requisition_id: null,
    title: "Software Engineer",
    detail_path: detailPath,
    locations: null,
    days_old: null,
    application_status: null,
    created_at: "2026-09-10T00:00:00.000Z",
    browser_base_url: browserBaseUrl,
    job_match_score_json: null,
    detail_id: null,
    detail_description: null,
    detail_employment_type: null,
    detail_locations: null,
    detail_valid_through: null,
    detail_remote_type: null,
    detail_applicant_locations: null,
});

describe("JobLinkMapper", () => {
    it("combines a base path and detail path into a job link", () => {
        const row = createJobPostRow("https://acme.example.com/careers", "jobs/123");

        expect(JobLinkMapper.mapJobLink(row)).toBe("https://acme.example.com/careers/jobs/123");
    });

    it("removes a trailing slash from the base path", () => {
        const row = createJobPostRow("https://acme.example.com/careers/", "jobs/123");

        expect(JobLinkMapper.mapJobLink(row)).toBe("https://acme.example.com/careers/jobs/123");
    });

    it("removes a leading slash from the detail path", () => {
        const row = createJobPostRow("https://acme.example.com/careers", "/jobs/123");

        expect(JobLinkMapper.mapJobLink(row)).toBe("https://acme.example.com/careers/jobs/123");
    });

    it("preserves the base URL protocol, host, and nested path", () => {
        const row = createJobPostRow("http://localhost:3000/workday/", "/job-posts/123");

        expect(JobLinkMapper.mapJobLink(row)).toBe("http://localhost:3000/workday/job-posts/123");
    });

    it("maps a Travelers Workday job link", () => {
        const row = createJobPostRow(
            "https://travelers.wd5.myworkdayjobs.com/en-US/External",
            "/job/CT---Hartford/Software-Engineer-II_R-51277"
        );

        expect(JobLinkMapper.mapJobLink(row)).toBe(
            "https://travelers.wd5.myworkdayjobs.com/en-US/External/job/CT---Hartford/Software-Engineer-II_R-51277"
        );
    });
});
