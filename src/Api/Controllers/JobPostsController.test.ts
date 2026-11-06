import { Module, RequestMethod, StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { IJobPostService } from "../../Application/JobPost/IJobPostService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { JobPostsController } from "./JobPostsController";

const service: IJobPostService = {
    list: vi.fn().mockResolvedValue({ data: [], totalCount: 0 }),
    getById: vi.fn(),
};
const logger: ILogger = {
    table: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

@Module({
    controllers: [JobPostsController],
    providers: [
        { provide: TOKENS.jobPostService, useValue: service },
        { provide: TOKENS.logger, useValue: logger },
    ],
})
class JobPostsTestModule {}

describe("JobPostsController", () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await NestFactory.create<NestFastifyApplication>(
            JobPostsTestModule,
            new FastifyAdapter({ logger: false }),
            { logger: false }
        );
        app.setGlobalPrefix("api/v1", {
            exclude: [{ path: "health", method: RequestMethod.ALL }],
        });
        app.useGlobalPipes(new StandardSchemaValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("defaults to postedDate descending", async () => {
        const response = await app.inject({ method: "GET", url: "/api/v1/job-posts" });
        expect(response.statusCode).toBe(200);
        expect(service.list).toHaveBeenCalledWith(
            10,
            1,
            expect.objectContaining({
                sortBy: "postedDate",
                sortDirection: "desc",
            })
        );
    });

    it.each(["companyName", "requisitionId", "title", "postedDate"])(
        "forwards a single %s sort in both directions",
        async sortBy => {
            for (const sortDirection of ["asc", "desc"]) {
                const response = await app.inject({
                    method: "GET",
                    url: `/api/v1/job-posts?sortBy=${sortBy}&sortDirection=${sortDirection}&pageCount=25&pageNumber=2`,
                });
                expect(response.statusCode).toBe(200);
                expect(service.list).toHaveBeenLastCalledWith(
                    25,
                    2,
                    expect.objectContaining({
                        sortBy,
                        sortDirection,
                    })
                );
            }
        }
    );

    it.each([
        "sortBy=jobMatchScore",
        "sortBy=applicationStatus",
        "sortBy=location",
        "sortBy=locations",
        "sortBy=title,location",
        "sortBy=title&sortBy=location",
        "sortDirection=dsc",
        "sortDirection=invalid",
        "pageNumber=0",
        "pageCount=0",
        "pageCount=1.5",
    ])("rejects unsupported query %s", async query => {
        const response = await app.inject({ method: "GET", url: `/api/v1/job-posts?${query}` });
        expect(response.statusCode).toBe(400);
        expect(service.list).not.toHaveBeenCalled();
    });

    it("does not expose the obsolete dismissed route", async () => {
        const response = await app.inject({ method: "PATCH", url: "/api/v1/job-posts/post-1/dismissed" });
        expect(response.statusCode).toBe(404);
    });

    it("preserves the ISO timestamp filter including its offset and precision", async () => {
        const postedDate = "2026-10-29T15:00:00.1234567+03:00";
        const response = await app.inject({
            method: "GET",
            url: `/api/v1/job-posts?postedDate=${encodeURIComponent(postedDate)}`,
        });

        expect(response.statusCode).toBe(200);
        expect(service.list).toHaveBeenCalledWith(10, 1, expect.objectContaining({ postedDate }));
    });

    it.each(["", " "])("omits a blank postedDate (%s)", async postedDate => {
        const response = await app.inject({
            method: "GET",
            url: `/api/v1/job-posts?postedDate=${encodeURIComponent(postedDate)}`,
        });

        expect(response.statusCode).toBe(200);
        expect(service.list).toHaveBeenCalledWith(10, 1, expect.objectContaining({ postedDate: undefined }));
    });

    it.each(["invalid", "2026-02-30T00:00:00Z", "2026-10-29", "2026-10-29T12:00:00"])(
        "rejects invalid postedDate %s",
        async postedDate => {
            const response = await app.inject({
                method: "GET",
                url: `/api/v1/job-posts?postedDate=${encodeURIComponent(postedDate)}`,
            });

            expect(response.statusCode).toBe(400);
            expect(service.list).not.toHaveBeenCalled();
        }
    );
});
