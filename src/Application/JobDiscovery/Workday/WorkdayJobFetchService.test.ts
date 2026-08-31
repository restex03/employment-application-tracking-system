import { beforeEach, describe, expect, it, vi } from "vitest";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IWorkdayJobsApiResponseMapper } from "../../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobsApiResponseMapper";

import { WorkdayJobFetchService } from "./WorkdayJobFetchService";
import { IJobGateway } from "../../../Domain/JobPosts/IJobSource";
import { IJobPostLookup } from "../../../Domain/JobPosts/IJobPostLookup";
import { IWorkdayJobDetailsApiResponseMapper } from "../../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobDetailsApiResponseMapper";

describe("WorkdayJobFetchService", () => {
    let jobGateway: IJobGateway;
    let lookupMapper: IWorkdayJobsApiResponseMapper;
    let detailMapper: IWorkdayJobDetailsApiResponseMapper;
    let logger: ILogger;

    let searchMock: ReturnType<typeof vi.fn>;
    let mapMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        searchMock = vi.fn();
        mapMock = vi.fn();

        jobGateway = {
            search: searchMock,
        } as unknown as IJobGateway;

        lookupMapper = {
            map: mapMock,
        } as unknown as IWorkdayJobsApiResponseMapper;

        detailMapper = {
            map: mapMock,
        } as unknown as IWorkdayJobDetailsApiResponseMapper;

        logger = {
            trace: vi.fn(),
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as unknown as ILogger;
    });

    const createService = () => new WorkdayJobFetchService({ jobGateway, lookupMapper, detailMapper, logger });

    const createJob = (overrides: Partial<IJobPostLookup> = {}): IJobPostLookup => ({
        jobSourceId: crypto.randomUUID(),
        title: "Software Engineer",
        company: "Example Company",
        detailPath: "/job/software-engineer_R-100",
        ...overrides,
    });

    describe("getJobsBatch", () => {
        it("constructs the Workday search request from the supplied options", async () => {
            const service = createService();

            searchMock.mockResolvedValue({
                total: 1,
                jobPostings: [],
            });

            await service.getJobsBatch({
                searchText: "software engineer",
                limit: 20,
                offset: 40,
            });

            expect(searchMock).toHaveBeenCalledOnce();

            expect(searchMock).toHaveBeenCalledWith({
                appliedFacets: {},
                limit: 20,
                offset: 40,
                searchText: "software engineer",
            });
        });

        it("uses an empty search string when searchText is undefined", async () => {
            const service = createService();

            searchMock.mockResolvedValue({
                total: 0,
                jobPostings: [],
            });

            await service.getJobsBatch({
                limit: 20,
                offset: 0,
            });

            expect(searchMock).toHaveBeenCalledWith({
                appliedFacets: {},
                limit: 20,
                offset: 0,
                searchText: "",
            });
        });

        it("maps every Workday posting and returns the total", async () => {
            const service = createService();

            const rawJob1 = {
                title: "Software Engineer",
                externalPath: "/job/software-engineer_R-100",
            };

            const rawJob2 = {
                title: "Platform Engineer",
                externalPath: "/job/platform-engineer_R-200",
            };

            const mappedJob1 = createJob({
                jobSourceId: "R-100",
                detailPath: rawJob1.externalPath,
            });

            const mappedJob2 = createJob({
                jobSourceId: "R-200",
                title: "Platform Engineer",
                detailPath: rawJob2.externalPath,
            });

            searchMock.mockResolvedValue({
                total: 42,
                jobPostings: [rawJob1, rawJob2],
            });

            mapMock.mockReturnValueOnce(mappedJob1).mockReturnValueOnce(mappedJob2);

            const result = await service.getJobsBatch({
                limit: 20,
                offset: 0,
            });

            expect(mapMock).toHaveBeenCalledTimes(2);
            expect(mapMock).toHaveBeenNthCalledWith(1, rawJob1);
            expect(mapMock).toHaveBeenNthCalledWith(2, rawJob2);

            expect(result).toEqual({
                total: 42,
                jobPostings: [mappedJob1, mappedJob2],
            });
        });
    });

    describe("fetchJobs", () => {
        it("fetches a single batch when all jobs fit within one page", async () => {
            const service = createService();

            const rawJob = {
                title: "Software Engineer",
                externalPath: "/job/software-engineer_R-100",
            };

            const mappedJob = createJob();

            searchMock.mockResolvedValue({
                total: 1,
                jobPostings: [rawJob],
            });

            mapMock.mockReturnValue(mappedJob);

            const result = await service.fetchLookups("software");

            expect(result).toEqual([mappedJob]);

            expect(searchMock).toHaveBeenCalledOnce();

            expect(searchMock).toHaveBeenCalledWith({
                appliedFacets: {},
                limit: 20,
                offset: 0,
                searchText: "software",
            });
        });

        it("paginates using offsets of 20 until the first reported total is reached", async () => {
            const service = createService();

            const rawJob1 = {
                title: "Job 1",
                externalPath: "/job/1",
            };

            const rawJob2 = {
                title: "Job 2",
                externalPath: "/job/2",
            };

            const rawJob3 = {
                title: "Job 3",
                externalPath: "/job/3",
            };

            searchMock
                .mockResolvedValueOnce({
                    total: 45,
                    jobPostings: [rawJob1],
                })
                .mockResolvedValueOnce({
                    // Later Workday totals may be unreliable.
                    total: 0,
                    jobPostings: [rawJob2],
                })
                .mockResolvedValueOnce({
                    total: 0,
                    jobPostings: [rawJob3],
                });

            mapMock
                .mockReturnValueOnce(
                    createJob({
                        jobSourceId: "R-1",
                        detailPath: "/job/1",
                    })
                )
                .mockReturnValueOnce(
                    createJob({
                        jobSourceId: "R-2",
                        detailPath: "/job/2",
                    })
                )
                .mockReturnValueOnce(
                    createJob({
                        jobSourceId: "R-3",
                        detailPath: "/job/3",
                    })
                );

            const result = await service.fetchLookups();

            expect(searchMock).toHaveBeenCalledTimes(3);

            expect(searchMock).toHaveBeenNthCalledWith(1, {
                appliedFacets: {},
                limit: 20,
                offset: 0,
                searchText: "",
            });

            expect(searchMock).toHaveBeenNthCalledWith(2, {
                appliedFacets: {},
                limit: 20,
                offset: 20,
                searchText: "",
            });

            expect(searchMock).toHaveBeenNthCalledWith(3, {
                appliedFacets: {},
                limit: 20,
                offset: 40,
                searchText: "",
            });

            expect(result).toHaveLength(3);
        });

        it("uses only the first batch total for pagination", async () => {
            const service = createService();

            searchMock
                .mockResolvedValueOnce({
                    total: 21,
                    jobPostings: [],
                })
                .mockResolvedValueOnce({
                    total: 500,
                    jobPostings: [],
                });

            const result = await service.fetchLookups();

            expect(searchMock).toHaveBeenCalledTimes(2);
            expect(result).toEqual([]);
        });

        it("deduplicates jobs by detailPath", async () => {
            const service = createService();

            const firstVersion = createJob({
                jobSourceId: "R-100",
                title: "Software Engineer",
                detailPath: "/job/software-engineer_R-100",
            });

            const duplicateVersion = createJob({
                jobSourceId: "R-100",
                title: "Senior Software Engineer",
                detailPath: "/job/software-engineer_R-100",
            });

            searchMock
                .mockResolvedValueOnce({
                    total: 21,
                    jobPostings: [{ externalPath: "/job/1" }],
                })
                .mockResolvedValueOnce({
                    total: 21,
                    jobPostings: [{ externalPath: "/job/2" }],
                });

            mapMock.mockReturnValueOnce(firstVersion).mockReturnValueOnce(duplicateVersion);

            const result = await service.fetchLookups();

            expect(result).toEqual([duplicateVersion]);
        });

        it("returns an empty array when Workday reports no jobs", async () => {
            const service = createService();

            searchMock.mockResolvedValue({
                total: 0,
                jobPostings: [],
            });

            const result = await service.fetchLookups();

            expect(result).toEqual([]);
            expect(searchMock).toHaveBeenCalledOnce();
            expect(mapMock).not.toHaveBeenCalled();
        });

        it("logs the total from the first batch", async () => {
            const service = createService();

            searchMock.mockResolvedValue({
                total: 37,
                jobPostings: [],
            });

            await service.fetchLookups();

            expect(logger.info).toHaveBeenCalledWith("[WorkdayJobFetchService.fetchJobs] Total jobs to fetch: 37");
        });
    });
});
