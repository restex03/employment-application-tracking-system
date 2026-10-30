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

}


export class JobPostGateway implements IJobPostGateway {
    constructor(private readonly baseUrl: string, private readonly logger: ILogger) {
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

        return this.validateJobPost(await response.json());
    }

    public async list(pageCount: number, pageNumber: number, queryFilters: JobPostQueryFilters): Promise<{ data: IJobPost[]; totalCount: number }> {
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

        const result: { data: IJobPost[]; totalCount: number } = await response.json();
        if (!result || !Array.isArray(result.data) ||
            !Number.isSafeInteger(result.totalCount) || result.totalCount < 0) {
            const errorMessage = "Invalid job post list response: expected data array and non-negative integer totalCount.";
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        return { data: result.data.map(jobPost => this.validateJobPost(jobPost)), totalCount: result.totalCount };
    }

    private validateJobPost(jobPost: IJobPost): IJobPost {
        if (jobPost.locations !== undefined && jobPost.locations !== null &&
            (!Array.isArray(jobPost.locations) || jobPost.locations.some(location => typeof location !== "string"))) {
            const errorMessage = `Invalid locations returned for job post ${jobPost.id}: expected a string array.`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        const postedDate = jobPost.postedDate;
        if (postedDate === undefined || postedDate === null) {
            return jobPost;
        }

        if (!z.iso.datetime({ offset: true }).safeParse(postedDate).success) {
            const errorMessage = `Invalid postedDate returned for job post ${jobPost.id}: ${postedDate}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        return jobPost;
    }
}
