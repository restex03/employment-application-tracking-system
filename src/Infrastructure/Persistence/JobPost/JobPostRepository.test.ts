import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IJobPost } from "../../../Domain/JobPosts/IJobPost";
import { JobPostQueryFilters } from "../../JobPosts/IJobPostGateway";
import { SqliteDatabaseConnection } from "./Sqlite/SqliteDatabaseConnection";
import { JobPostRepository } from "./JobPostRepository";

describe("JobPostRepository", () => {
    let connection: SqliteDatabaseConnection;
    let repository: JobPostRepository;

    beforeEach(() => {
        connection = new SqliteDatabaseConnection(":memory:");
        repository = new JobPostRepository(connection.db);
    });

    afterEach(() => {
        connection.close();
    });

    it("upserts and reads a job post with JSON locations and detail", async () => {
        const jobPost = makeJobPost({ locations: ["New York, NY", "Remote"] });

        await repository.upsert(jobPost);

        await expect(repository.getById(jobPost.id)).resolves.toEqual(jobPost);
        await expect(repository.getById("missing")).resolves.toBeUndefined();
    });

    it("updates an existing job post on upsert", async () => {
        const jobPost = makeJobPost();
        await repository.upsert(jobPost);
        const updated = { ...jobPost, title: "Staff Engineer", locations: ["Remote"] };

        await repository.upsert(updated);

        await expect(repository.getById(jobPost.id)).resolves.toEqual(updated);
        const [{ count }] = connection.db.prepare('SELECT COUNT(*) AS count FROM "JobPosts"').all() as {
            count: number;
        }[];
        expect(count).toBe(1);
    });

    it("uses an empty JSON array as the locations column default", () => {
        connection.db
            .prepare(
                `INSERT INTO "JobPosts" ("id", "sourceId", "companyName", "title", "detailPath", "jobLink", "createdAt", "detail")
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run("post-1", "source-1", "Acme", "Engineer", "/jobs/1", "https://example.com/jobs/1", Date.now(), "{}");

        const row = connection.db.prepare('SELECT "locations" FROM "JobPosts" WHERE "id" = ?').get("post-1") as {
            locations: string;
        };
        expect(JSON.parse(row.locations)).toEqual([]);
    });

    it("filters by company, requisition, title, location, and posted date", async () => {
        await repository.upsert(
            makeJobPost({
                id: "matching",
                companyName: "Acme Software",
                requisitionId: "REQ-42",
                title: "Senior Backend Engineer",
                locations: ["New York, NY"],
                postedDate: "2026-10-29T15:00:00.1234567+03:00",
            })
        );
        await repository.upsert(
            makeJobPost({
                id: "other-company",
                companyName: "Other Inc",
                requisitionId: "REQ-42",
                title: "Senior Backend Engineer",
                locations: ["New York, NY"],
                postedDate: "2026-10-30T00:00:00Z",
            })
        );
        await repository.upsert(
            makeJobPost({
                id: "other-location",
                companyName: "Acme Software",
                requisitionId: "REQ-42",
                title: "Senior Backend Engineer",
                locations: ["Boston, MA"],
                postedDate: "2026-10-30T00:00:00Z",
            })
        );

        const result = await repository.list(10, 1, {
            companyName: "acme",
            requisitionId: "req-4",
            title: "backend",
            location: "new york",
            postedDate: "2026-10-29T12:00:00Z",
        });

        expect(result).toEqual({ data: [expect.objectContaining({ id: "matching" })], totalCount: 1 });
    });

    it("sorts, paginates, and returns the total number of filtered records", async () => {
        await repository.upsert(makeJobPost({ id: "post-a", postedDate: "2026-10-29T00:00:00Z" }));
        await repository.upsert(makeJobPost({ id: "post-b", postedDate: "2026-10-31T00:00:00Z" }));
        await repository.upsert(makeJobPost({ id: "post-c", postedDate: null }));

        const result = await repository.list(1, 2, emptyFilters);

        expect(result.data.map(jobPost => jobPost.id)).toEqual(["post-a"]);
        expect(result.totalCount).toBe(3);
    });

    it("rejects invalid pagination", async () => {
        await expect(repository.list(0, 1, emptyFilters)).rejects.toThrow(RangeError);
        await expect(repository.list(10, 1.5, emptyFilters)).rejects.toThrow(RangeError);
    });
});

const emptyFilters: JobPostQueryFilters = {
    companyName: "",
    requisitionId: "",
    title: "",
    location: "",
};

function makeJobPost(overrides: Partial<IJobPost> = {}): IJobPost {
    return {
        id: "post-1",
        sourceId: "source-1",
        companyName: "Acme",
        requisitionId: "REQ-1",
        title: "Software Engineer",
        detailPath: "/jobs/post-1",
        jobLink: "https://example.com/jobs/post-1",
        locations: [],
        postedDate: "2026-10-29T12:00:00Z",
        createdAt: new Date("2026-10-30T00:00:00Z"),
        detail: { title: "Software Engineer", description: "Job description" },
        remoteType: "remote",
        ...overrides,
    };
}
