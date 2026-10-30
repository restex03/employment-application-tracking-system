import { afterEach, describe, expect, it, vi } from "vitest";
import { ILogger } from "../Logging/ILogger";
import { JobPostGateway } from "./IJobPostGateway";
import { JobPostQueryFilters } from "../../Application/JobPost/IJobPostService";

describe("JobPostGateway", () => {
    const logger: ILogger = {
        table: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("gets a job post by ID and returns its JSON response", async () => {
        const result = { id: "post-1", title: "Developer", postedDate: "2026-10-29T12:00:00.1234567Z" };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.getById("post-1")).resolves.toEqual(result);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url.href).toBe("https://ingestion.example.com/api/ingestion/jobPosts/post-1");
        expect(init).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    });

    it("encodes the job post ID as a path segment", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "post/1?#" })));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await gateway.getById("post/1?#");

        expect(fetchMock.mock.calls[0][0].href).toBe(
            "https://ingestion.example.com/api/ingestion/jobPosts/post%2F1%3F%23"
        );
    });

    it("logs and returns undefined when fetching a job post returns HTTP 404", async () => {
        const response = new Response("Job post not found", { status: 404, statusText: "Not Found" });
        const jsonSpy = vi.spyOn(response, "json");
        const fetchMock = vi.fn().mockResolvedValue(response);
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.getById("missing")).resolves.toBeUndefined();
        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, init] = fetchMock.mock.calls[0];
        expect(url.href).toBe("https://ingestion.example.com/api/ingestion/jobPosts/missing");
        expect(init).toEqual({ method: "GET", headers: { Accept: "application/json" } });
        expect(jsonSpy).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledOnce();
        expect(logger.error).toHaveBeenCalledWith("Job post with ID missing not found.");
    });

    it("logs and throws when fetching a job post returns HTTP 500", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response("failure details", { status: 500, statusText: "Internal Server Error" })
        ));
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.getById("post-1")).rejects.toThrow(
            "Failed to fetch job post post-1: HTTP 500 Internal Server Error. failure details"
        );
        expect(logger.error).toHaveBeenCalledOnce();
    });

    it("sends all included filters with GET and returns the JSON response", async () => {
        const result = [{ id: "post-1", postedDate: "2026-10-29T12:00:00Z" }];
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: result, totalCount: 75 })));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        const filters: JobPostQueryFilters = {
            companyName: "A & B",
            requisitionId: "REQ/123",
            title: "C# developer",
            location: "New York",
            postedDate: "2026-10-29T15:00:00.1234567+03:00",
            jobMatchScore: 0,
            applicationStatus: "Applied",
            sortBy: "title",
            sortDirection: "asc",
        };
        await expect(gateway.list(20, 1, filters)).resolves.toEqual({ data: result, totalCount: 75 });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url.pathname).toBe("/api/ingestion/jobPosts");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            pageCount: "20",
            pageNumber: "1",
            companyName: "A & B",
            requisitionId: "REQ/123",
            title: "C# developer",
            location: "New York",
            postedDate: "2026-10-29T15:00:00.1234567+03:00",
            sortBy: "title",
            sortDirection: "asc",
        });
        expect(init).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    });

    it("omits blank strings and undefined optional filters", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], totalCount: 0 })));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await gateway.list(10, 1, {
            companyName: "",
            requisitionId: " ",
            title: "\t",
            location: "",
            postedDate: undefined,
        });

        expect(Object.fromEntries(fetchMock.mock.calls[0][0].searchParams)).toEqual({
            pageCount: "10",
            pageNumber: "1",
            sortBy: "postedDate",
            sortDirection: "desc",
        });
    });

    it.each([null, undefined])("preserves an unknown postedDate (%s)", async postedDate => {
        vi.stubGlobal("fetch", vi.fn().mockImplementation(async () =>
            new Response(JSON.stringify({ id: "post-1", postedDate }))
        ));
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        expect((await gateway.getById("post-1"))?.postedDate).toBe(postedDate);
    });

    it.each([
        null, [], {}, { data: [], totalCount: "75" }, { data: [], totalCount: -1 },
        { data: [], totalCount: 1.5 }, { data: {}, totalCount: 0 },
    ])("rejects an invalid list envelope %j", async result => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(result))));
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);
        await expect(gateway.list(10, 1, {
            companyName: "", requisitionId: "", title: "", location: "",
        })).rejects.toThrow("Invalid job post list response");
        expect(logger.error).toHaveBeenCalledOnce();
    });

    it.each(["not-a-date", "2026-02-30T00:00:00Z", "2026-10-29T12:00:00"])(
        "logs and rejects invalid ingestion postedDate %s",
        async postedDate => {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ id: "post-1", postedDate }))
            ));
            const gateway = new JobPostGateway("https://ingestion.example.com", logger);

            await expect(gateway.getById("post-1")).rejects.toThrow("Invalid postedDate");
            expect(logger.error).toHaveBeenCalledOnce();
        }
    );

    it("logs and throws on HTTP failure", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response("failure details", { status: 500, statusText: "Internal Server Error" })
        ));
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.list(20, 0, {
            companyName: "",
            requisitionId: "",
            title: "",
            location: "",
        })).rejects.toThrow("HTTP 500 Internal Server Error. failure details");
        expect(logger.error).toHaveBeenCalledOnce();
    });
});
