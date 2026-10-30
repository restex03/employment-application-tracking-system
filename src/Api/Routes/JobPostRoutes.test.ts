import Fastify from "fastify";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { IJobPostService } from "../../Application/JobPost/IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { JobPostRoutes } from "./JobPostRoutes";

describe("JobPostRoutes postedDate filter", () => {
    const server = Fastify();
    const service: IJobPostService = {
        list: vi.fn().mockResolvedValue({ data: [], totalCount: 0 }),
        getById: vi.fn(),
    };
    const logger: ILogger = {
        table: vi.fn(), trace: vi.fn(), debug: vi.fn(),
        info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    };
    new JobPostRoutes(service, logger).register(server);

    afterAll(async () => {
        await server.close();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("defaults to postedDate descending", async () => {
        const response = await server.inject({ method: "GET", url: "/job-posts" });
        expect(response.statusCode).toBe(200);
        expect(service.list).toHaveBeenCalledWith(10, 1, expect.objectContaining({
            sortBy: "postedDate", sortDirection: "desc",
        }));
    });

    it.each(["companyName", "requisitionId", "title", "location", "postedDate"])(
        "forwards a single %s sort in both directions",
        async sortBy => {
            for (const sortDirection of ["asc", "desc"]) {
                const response = await server.inject({
                    method: "GET", url: `/job-posts?sortBy=${sortBy}&sortDirection=${sortDirection}&pageCount=25&pageNumber=2`,
                });
                expect(response.statusCode).toBe(200);
                expect(service.list).toHaveBeenLastCalledWith(25, 2, expect.objectContaining({
                    sortBy, sortDirection,
                }));
            }
        }
    );

    it.each([
        "sortBy=jobMatchScore", "sortBy=applicationStatus", "sortBy=title,location",
        "sortBy=title&sortBy=location", "sortDirection=dsc", "sortDirection=invalid",
        "pageNumber=0", "pageCount=0", "pageCount=1.5",
    ])("rejects unsupported query %s", async query => {
        const response = await server.inject({ method: "GET", url: `/job-posts?${query}` });
        expect(response.statusCode).toBe(400);
        expect(service.list).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledOnce();
    });

    it("no longer exposes the obsolete dismissed route", async () => {
        const response = await server.inject({ method: "PATCH", url: "/job-posts/post-1/dismissed" });
        expect(response.statusCode).toBe(404);
    });

    it("preserves the ISO timestamp filter including its offset and precision", async () => {
        const postedDate = "2026-10-29T15:00:00.1234567+03:00";
        const response = await server.inject({
            method: "GET",
            url: `/job-posts?postedDate=${encodeURIComponent(postedDate)}`,
        });

        expect(response.statusCode).toBe(200);
        expect(service.list).toHaveBeenCalledWith(10, 1, expect.objectContaining({
            postedDate,
        }));
    });

    it.each(["", " "])("omits a blank postedDate (%s)", async postedDate => {
        const response = await server.inject({
            method: "GET",
            url: `/job-posts?postedDate=${encodeURIComponent(postedDate)}`,
        });

        expect(response.statusCode).toBe(200);
        expect(service.list).toHaveBeenCalledWith(10, 1, expect.objectContaining({ postedDate: undefined }));
    });

    it.each(["invalid", "2026-02-30T00:00:00Z", "2026-10-29", "2026-10-29T12:00:00"])(
        "returns 400 for invalid postedDate %s without calling the service",
        async postedDate => {
            const response = await server.inject({
                method: "GET",
                url: `/job-posts?postedDate=${encodeURIComponent(postedDate)}`,
            });

            expect(response.statusCode).toBe(400);
            expect(response.json()).toEqual({
                error: "postedDate must be an ISO 8601 timestamp with a timezone.",
            });
            expect(service.list).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledOnce();
        }
    );
});
