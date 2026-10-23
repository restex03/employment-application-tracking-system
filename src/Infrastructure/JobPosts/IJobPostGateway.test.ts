import { afterEach, describe, expect, it, vi } from "vitest";
import { ILogger } from "../Logging/ILogger";
import { JobPostGateway } from "./IJobPostGateway";

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
        const result = { id: "post-1", title: "Developer" };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.getJobPost("post-1")).resolves.toEqual(result);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url.href).toBe("https://ingestion.example.com/ingestion/jobPosts/post-1");
        expect(init).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    });

    it("encodes the job post ID as a path segment", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "post/1?#" })));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await gateway.getJobPost("post/1?#");

        expect(fetchMock.mock.calls[0][0].href).toBe(
            "https://ingestion.example.com/ingestion/jobPosts/post%2F1%3F%23"
        );
    });

    it("logs and returns undefined when fetching a job post returns HTTP 404", async () => {
        const response = new Response("Job post not found", { status: 404, statusText: "Not Found" });
        const jsonSpy = vi.spyOn(response, "json");
        const fetchMock = vi.fn().mockResolvedValue(response);
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.getJobPost("missing")).resolves.toBeUndefined();
        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, init] = fetchMock.mock.calls[0];
        expect(url.href).toBe("https://ingestion.example.com/ingestion/jobPosts/missing");
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

        await expect(gateway.getJobPost("post-1")).rejects.toThrow(
            "Failed to fetch job post post-1: HTTP 500 Internal Server Error. failure details"
        );
        expect(logger.error).toHaveBeenCalledOnce();
    });

    it("sends all included filters with GET and returns the JSON response", async () => {
        const result = { data: [], totalCount: 0 };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
        vi.stubGlobal("fetch", fetchMock);
        const gateway = new JobPostGateway("https://ingestion.example.com", logger);

        await expect(gateway.list(20, 0, {
            companyName: "A & B",
            requisitionId: "REQ/123",
            title: "C# developer",
            location: "New York",
            daysOld: 0,
            jobMatchScore: 0,
            applicationStatus: "Applied",
        })).resolves.toEqual(result);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url.pathname).toBe("/ingestion/jobPosts");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            pageCount: "20",
            pageNumber: "0",
            companyName: "A & B",
            requisitionId: "REQ/123",
            title: "C# developer",
            location: "New York",
            daysOld: "0",
            jobMatchScore: "0",
            applicationStatus: "Applied",
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
            daysOld: undefined,
            applicationStatus: "",
        });

        expect(Object.fromEntries(fetchMock.mock.calls[0][0].searchParams)).toEqual({
            pageCount: "10",
            pageNumber: "1",
        });
    });

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
