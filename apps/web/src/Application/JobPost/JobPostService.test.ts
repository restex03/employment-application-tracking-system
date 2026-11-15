import { describe, expect, it, vi } from "vitest";
import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobPostQueries } from "../../Infrastructure/Persistence/JobPost/IJobPostQueries";
import { JobPostService } from "./JobPostService";

describe("JobPostService postedDate responses", () => {
    it.each(["2026-10-29T15:00:00.1234567+03:00", null, undefined])(
        "preserves postedDate %s for list and single-post responses",
        async postedDate => {
            const post: IJobPost = {
                id: "post-1",
                sourceId: "source-1",
                companyName: "Example Company",
                title: "Developer",
                detailPath: "/jobs/post-1",
                jobLink: "https://example.com/jobs/post-1",
                locations: [],
                importedDate: new Date("2026-10-30T00:00:00Z"),
                postedDate,
                detail: { title: "Developer", description: "" },
            };
            const repository: IJobPostRepository = {
                list: vi.fn().mockResolvedValue({ data: [post], totalCount: 42 }),
                getById: vi.fn().mockResolvedValue(post),
                getLatestJob: vi.fn().mockResolvedValue(post),
                upsert: vi.fn(),
                upsertMany: vi.fn(),
            };
            const gateway: IJobPostGateway = {
                getById: vi.fn(),
                list: vi.fn(),
                listFromDate: vi.fn(),
            };
            const queries: IJobPostQueries = {
                getJobPostsForClient: vi.fn().mockResolvedValue({ data: [post], totalCount: 42 }),
                getJobAssessments: vi.fn().mockResolvedValue([]),
                getJobApplications: vi.fn().mockResolvedValue([]),
            };
            const logger: ILogger = {
                trace: vi.fn(),
                debug: vi.fn(),
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            };
            const service = new JobPostService(repository, queries, gateway, logger);
            const filters = {
                companyName: "",
                requisitionId: "",
                title: "",
                location: "",
                postedDate: "2026-10-28T00:00:00Z",
                jobMatchScore: 50,
                applicationStatus: "APPLIED",
            };

            const list = await service.list(10, 1, filters);
            const single = await service.getById(post.id);
            expect(list.data[0].postedDate).toBe(postedDate);
            expect(single?.postedDate).toBe(postedDate);
            expect(queries.getJobPostsForClient).toHaveBeenCalledWith(10, 1, filters);
            expect(list.totalCount).toBe(42);
            expect(list.data[0]).not.toHaveProperty("daysOld");
            expect(single).not.toHaveProperty("daysOld");
        }
    );

    it("delegates imported job posts to the repository", async () => {
        const post = {} as IJobPost;
        const repository: IJobPostRepository = {
            getById: vi.fn(),
            getLatestJob: vi.fn(),
            list: vi.fn(),
            upsert: vi.fn(),
            upsertMany: vi.fn().mockResolvedValue(undefined),
        };
        const jobPosts = [post];
        const fromDate = "2026-10-30T00:00:00.000001Z";
        const gateway: IJobPostGateway = {
            getById: vi.fn(),
            list: vi.fn(),
            listFromDate: vi.fn().mockResolvedValue({ data: jobPosts, totalCount: 1 }),
        };
        const logger: ILogger = {
            trace: vi.fn(),
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };
        const service = new JobPostService(repository, {} as IJobPostQueries, gateway, logger);

        await service.importJobPosts(fromDate);

        expect(gateway.listFromDate).toHaveBeenCalledWith(fromDate);
        expect(repository.upsertMany).toHaveBeenCalledWith(jobPosts);
    });
});
