import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { ILogger } from "../Logging/ILogger";
import { z } from "zod";
import { JobPostSortBy, JobPostSortDirection } from "../../Application/JobPost/IJobPostService";

export interface JobPostQueryFilters {
    companyName: string;
    requisitionId: string;
    title: string;
    location: string;
    postedDate?: string;
    sortBy?: JobPostSortBy;
    sortDirection?: JobPostSortDirection;
}

export interface IJobPostGateway {
    getById(id: string): Promise<IJobPost | undefined>;

    list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPost[]; totalCount: number }>;

    listFromDate(fromDate: string): Promise<{ data: IJobPost[]; totalCount: number }>;
}

export interface JobPostDto {
    id: string;
    sourceId: string;
    companyName: string;
    requisitionId: string | null;
    title: string;
    jobLink: string;
    detailPath: string;
    locations: string[];
    publishedDate: string;
    detail: JobPostDetailDto | null;
    remoteType: string | null;
    postedDate: string | null;
}

interface JobPostDetailDto {
    id: string;
    description: string;
    employmentType: string | null;
    locations: JobPostLocationDto[] | null;
    validThrough: string | null;
    remoteType: string | null;
    applicantLocations: string[] | null;
    fetchedAt: string;
}

interface JobPostLocationDto {
    streetAddress: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
}

export class JobPostGateway implements IJobPostGateway {
    constructor(
        private readonly baseUrl: string,
        private readonly logger: ILogger
    ) {}

    public async listFromDate(fromDate: string): Promise<{ data: IJobPost[]; totalCount: number }> {
        const pageCount = 200;
        const data: IJobPost[] = [];
        let pageNumber = 1;
        let totalCount = 0;

        while (true) {
            const fullURL = new URL("/api/ingestion/jobPosts/from-date", this.baseUrl);
            fullURL.searchParams.append("fromDate", fromDate);
            fullURL.searchParams.append("pageCount", pageCount.toString());
            fullURL.searchParams.append("pageNumber", pageNumber.toString());

            const response = await fetch(fullURL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `Failed to fetch job posts from date: HTTP ${response.status} ${response.statusText}. ${errorText}`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            const result: { data: JobPostDto[]; totalCount: number } = await response.json();
            if (
                !result ||
                !Array.isArray(result.data) ||
                !Number.isSafeInteger(result.totalCount) ||
                result.totalCount < 0
            ) {
                const errorMessage =
                    "Invalid job post list response: expected data array and non-negative integer totalCount.";
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            data.push(...result.data.map(jobPost => this.mapJobPost(jobPost)));
            totalCount += result.totalCount;
            if (result.data.length < pageCount) {
                break;
            }

            pageNumber++;
        }

        return { data, totalCount };
    }
    public async getById(id: string): Promise<IJobPost | undefined> {
        const path = `/api/ingestion/jobPosts/${encodeURIComponent(id)}`;
        const fullUrl = new URL(`${path}`, this.baseUrl);
        const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });
        if (response.status === 404) {
            const errorMessage = `Job post with ID ${id} not found.`;
            this.logger.error(errorMessage);
            return undefined;
        }
        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = `Failed to fetch job post ${id}: HTTP ${response.status} ${response.statusText}. ${errorText}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        return this.mapJobPost(await response.json());
    }

    public async list(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPost[]; totalCount: number }> {
        const path = `/api/ingestion/jobPosts`;
        const fullURL = new URL(`${path}`, this.baseUrl);
        fullURL.searchParams.append("pageCount", pageCount.toString());
        fullURL.searchParams.append("pageNumber", pageNumber.toString());
        const supportedFilters: JobPostQueryFilters = {
            companyName: queryFilters.companyName,
            requisitionId: queryFilters.requisitionId,
            title: queryFilters.title,
            location: queryFilters.location,
            postedDate: queryFilters.postedDate,
            sortBy: queryFilters.sortBy ?? "postedDate",
            sortDirection: queryFilters.sortDirection ?? "desc",
        };
        for (const [name, value] of Object.entries(supportedFilters)) {
            if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
                continue;
            }
            fullURL.searchParams.append(name, String(value));
        }

        const response = await fetch(fullURL, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = `Failed to fetch job posts: HTTP ${response.status} ${response.statusText}. ${errorText}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        const result: { data: JobPostDto[]; totalCount: number } = await response.json();
        if (
            !result ||
            !Array.isArray(result.data) ||
            !Number.isSafeInteger(result.totalCount) ||
            result.totalCount < 0
        ) {
            const errorMessage =
                "Invalid job post list response: expected data array and non-negative integer totalCount.";
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        return { data: result.data.map(jobPost => this.mapJobPost(jobPost)), totalCount: result.totalCount };
    }

    private mapJobPost(jobPost: JobPostDto): IJobPost {
        if (!jobPost || typeof jobPost !== "object") {
            const errorMessage = "Invalid job post response: expected a job post object.";
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        if (!Array.isArray(jobPost.locations) || jobPost.locations.some(location => typeof location !== "string")) {
            const errorMessage = `Invalid locations returned for job post ${jobPost.id}: expected a string array.`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        if (typeof jobPost.companyName !== "string") {
            const errorMessage = `Invalid companyName returned for job post ${jobPost.id}: expected a string.`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        if (!z.iso.datetime({ offset: true }).safeParse(jobPost.publishedDate).success) {
            const errorMessage = `Invalid publishedDate returned for job post ${jobPost.id}: ${jobPost.publishedDate}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        const postedDate = jobPost.postedDate;
        if (
            postedDate !== undefined &&
            postedDate !== null &&
            !z.iso.datetime({ offset: true }).safeParse(postedDate).success
        ) {
            const errorMessage = `Invalid postedDate returned for job post ${jobPost.id}: ${postedDate}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        if (jobPost.detail === null || jobPost.detail === undefined) {
            const errorMessage = `Invalid job post response for ${jobPost.id}: expected detail to be present.`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        return {
            id: jobPost.id,
            sourceId: jobPost.sourceId,
            companyName: jobPost.companyName,
            requisitionId: jobPost.requisitionId ?? undefined,
            title: jobPost.title,
            jobLink: jobPost.jobLink,
            detailPath: jobPost.detailPath,
            locations: jobPost.locations,
            postedDate: jobPost.postedDate,
            importedDate: new Date(jobPost.publishedDate),
            remoteType: jobPost.remoteType ?? undefined,
            detail: {
                id: jobPost.detail.id,
                requisitionId: jobPost.requisitionId ?? undefined,
                title: jobPost.title,
                description: jobPost.detail.description,
                validThrough: jobPost.detail.validThrough ?? undefined,
                employmentType: jobPost.detail.employmentType ?? undefined,
                locations: jobPost.detail.locations?.map(location => ({
                    streetAddress: location.streetAddress ?? undefined,
                    city: location.city ?? undefined,
                    state: location.state ?? undefined,
                    postalCode: location.postalCode ?? undefined,
                    country: location.country ?? undefined,
                })),
                remoteType: jobPost.detail.remoteType ?? undefined,
                applicantLocations: jobPost.detail.applicantLocations ?? undefined,
            },
        };
    }
}
