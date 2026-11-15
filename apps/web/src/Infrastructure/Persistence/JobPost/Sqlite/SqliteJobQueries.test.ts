import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IJobPost } from "../../../../Domain/JobPosts/IJobPost";
import { JobPostQueryFilters } from "../../../JobPosts/IJobPostGateway";
import { ILogger } from "../../../Logging/ILogger";
import { JobPostRepository } from "../JobPostRepository";
import { SqliteDatabaseProvider } from "../../SqliteDatabaseProvider";
import { SqliteJobQueries } from "./SqliteJobQueries";

describe("SqliteJobQueries", () => {
    let connection: SqliteDatabaseProvider;
    let queries: SqliteJobQueries;
    let jobPosts: JobPostRepository;

    beforeEach(() => {
        connection = new SqliteDatabaseProvider(":memory:");
        queries = new SqliteJobQueries(connection.database, createLogger());
        jobPosts = new JobPostRepository(connection.database);
    });

    afterEach(() => {
        connection.close();
    });

    it("joins the latest application and assessment and applies filters before pagination", async () => {
        await jobPosts.upsertMany([
            makeJobPost({ id: "post-a", postedDate: "2026-10-30T00:00:00Z" }),
            makeJobPost({ id: "post-b", postedDate: "2026-10-29T00:00:00Z" }),
            makeJobPost({ id: "post-c", postedDate: "2026-10-28T00:00:00Z" }),
        ]);
        addCandidate("candidate-a");
        addCandidate("candidate-b");
        addApplication("application-old", "post-a", "INTERVIEW", "2026-10-30T00:00:00Z");
        addApplication("application-new", "post-a", "APPLIED", "2026-10-31T00:00:00Z");
        addApplication("application-b", "post-b", "APPLIED", "2026-10-31T00:00:00Z");
        addAssessment("assessment-old", "candidate-a", "post-a", "2026-10-30T00:00:00Z", 95);
        addAssessment("assessment-new", "candidate-b", "post-a", "2026-10-31T00:00:00Z", 78);
        addAssessment("assessment-b", "candidate-a", "post-b", "2026-10-31T00:00:00Z", 65);

        const result = await queries.getJobPostsForClient(1, 1, {
            ...emptyFilters,
            applicationStatus: "APPLIED",
            jobMatchScore: 70,
        });

        expect(result.totalCount).toBe(1);
        expect(result.data).toMatchObject([
            {
                id: "post-a",
                applicationStatus: "APPLIED",
                requirementMatchScore: 78,
            },
        ]);
    });

    it("filters posts without applications and returns all posts when optional filters are absent", async () => {
        await jobPosts.upsertMany([
            makeJobPost({ id: "post-a", postedDate: "2026-10-30T00:00:00Z" }),
            makeJobPost({ id: "post-b", postedDate: "2026-10-29T00:00:00Z" }),
        ]);
        addApplication("application-a", "post-a", "APPLIED", "2026-10-31T00:00:00Z");

        const withoutApplication = await queries.getJobPostsForClient(10, 1, {
            ...emptyFilters,
            applicationStatus: "NONE",
        });
        const unfiltered = await queries.getJobPostsForClient(10, 1, emptyFilters);

        expect(withoutApplication.totalCount).toBe(1);
        expect(withoutApplication.data.map(post => post.id)).toEqual(["post-b"]);
        expect(unfiltered.totalCount).toBe(2);
        expect(unfiltered.data).toHaveLength(2);
    });

    function addCandidate(id: string): void {
        connection.client.prepare("INSERT INTO candidate_profiles (id, total_years_experience) VALUES (?, 0)").run(id);
    }

    function addApplication(id: string, jobPostId: string, status: string, createdAt: string): void {
        connection.client
            .prepare("INSERT INTO job_applications (id, job_post_id, status, created_at) VALUES (?, ?, ?, ?)")
            .run(id, jobPostId, status, createdAt);
    }

    function addAssessment(
        id: string,
        candidateProfileId: string,
        jobPostId: string,
        createdAt: string,
        score: number
    ): void {
        connection.client
            .prepare(
                `INSERT INTO job_assessments (
                    id, candidate_profile_id, job_post_id, created_at, status, review_status, job_match_score_json
                ) VALUES (?, ?, ?, ?, 'complete', 'unreviewed', ?)`
            )
            .run(
                id,
                candidateProfileId,
                jobPostId,
                createdAt,
                JSON.stringify({
                    score,
                    totalRequirements: 1,
                    directMatches: 1,
                    transferableMatches: 0,
                    missingMatches: 0,
                })
            );
    }
});

const emptyFilters: JobPostQueryFilters = {
    companyName: "",
    requisitionId: "",
    title: "",
    location: "",
};

function makeJobPost(overrides: Partial<IJobPost> = {}): IJobPost {
    return {
        id: "post-default",
        sourceId: "source-1",
        companyName: "Example Company",
        title: "Software Engineer",
        detailPath: "/jobs/post",
        jobLink: "https://example.com/jobs/post",
        locations: [],
        importedDate: new Date("2026-10-31T00:00:00Z"),
        postedDate: null,
        detail: { title: "Software Engineer", description: "" },
        ...overrides,
    };
}

function createLogger(): ILogger {
    return {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
}
