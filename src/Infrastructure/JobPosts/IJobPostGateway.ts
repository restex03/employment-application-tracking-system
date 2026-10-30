import { IJobPost } from "../../Domain/JobPosts/IJobPost";
import { ILogger } from "../Logging/ILogger";


export interface JobPostQueryFilters {
    companyName: string;
    requisitionId: string;
    title: string;
    location: string;
    daysOld?: number;
    jobMatchScore?: number;
    applicationStatus?: string;
}

export interface IJobPostGateway {
    getById(id: string): Promise<IJobPost | undefined>;
    
    list(
        pageCount: number, 
        pageNumber: number, 
        queryFilters: JobPostQueryFilters
    ): Promise<IJobPost[]>;

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

        return await response.json();
    }

    public async list(pageCount: number, pageNumber: number, queryFilters: JobPostQueryFilters): Promise<IJobPost[]> {
        const path = `/api/ingestion/jobPosts`;
        const fullURL = new URL(`${path}`, this.baseUrl);
        fullURL.searchParams.append("pageCount", pageCount.toString());
        fullURL.searchParams.append("pageNumber", pageNumber.toString());
        for (const [name, value] of Object.entries(queryFilters)) {
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

        return await response.json();
    }
    

}