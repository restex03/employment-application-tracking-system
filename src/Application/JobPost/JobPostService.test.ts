import { describe, expect, it, vi } from "vitest";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";
import { JobPostService } from "./JobPostService";

describe("JobPostService postedDate responses", () => {
    it.each(["2026-10-29T15:00:00.1234567+03:00", null, undefined])(
        "preserves postedDate %s for list and single-post responses",
        async postedDate => {
            const post: IJobPost = {
                id: "post-1",
                sourceId: "source-1",
                title: "Developer",
                detailPath: "/jobs/post-1",
                jobLink: "https://example.com/jobs/post-1",
                createdAt: new Date("2026-10-30T00:00:00Z"),
                postedDate,
                detail: { title: "Developer", description: "" },
                hydrateDetail: vi.fn(),
            };
            const gateway: IJobPostGateway = {
                list: vi.fn().mockResolvedValue({ data: [post], totalCount: 42 }),
                getById: vi.fn().mockResolvedValue(post),
            };
            const queries: IJobPostQueries = {
                getJobAssessments: vi.fn().mockResolvedValue([]),
                getJobApplications: vi.fn().mockResolvedValue([]),
            };
            const logger: ILogger = {
                table: vi.fn(), trace: vi.fn(), debug: vi.fn(),
                info: vi.fn(), warn: vi.fn(), error: vi.fn(),
            };
            const service = new JobPostService(gateway, queries, logger);
            const filters = {
                companyName: "", requisitionId: "", title: "", location: "",
                postedDate: "2026-10-28T00:00:00Z",
                jobMatchScore: 50,
                applicationStatus: "APPLIED",
            };

            const list = await service.list(10, 0, filters);
            const single = await service.getById(post.id);
            expect(list.data[0].postedDate).toBe(postedDate);
            expect(single?.postedDate).toBe(postedDate);
            expect(gateway.list).toHaveBeenCalledWith(10, 0, {
                companyName: "", requisitionId: "", title: "", location: "",
                postedDate: filters.postedDate,
            });
            expect(list.totalCount).toBe(42);
            expect(list.data[0]).not.toHaveProperty("daysOld");
            expect(single).not.toHaveProperty("daysOld");
        }
    );
});
