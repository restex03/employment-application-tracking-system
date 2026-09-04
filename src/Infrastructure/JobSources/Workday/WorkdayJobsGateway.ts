import { ILogger } from "../../Logging/ILogger";
import { IJobsLookupRequest } from "../../../Domain/JobPosts/IJobsLookupRequest";
import { IJobGateway } from "../../../Domain/JobPosts/IJobSource";
import { IWorkdayJobDetailsApiResponse } from "./Contracts/IWorkdayJobDetailsApiResponse";
import { IWorkdayJobsApiResponse } from "./Contracts/IWorkdayJobsApiResponse";

export class WorkdayJobsGateway implements IJobGateway {
    private readonly baseUrl: string;
    private readonly logger: ILogger;

    constructor(opts: { baseUrl: string; logger: ILogger }) {
        this.baseUrl = opts.baseUrl.endsWith("/") ? opts.baseUrl : `${opts.baseUrl}/`;
        this.logger = opts.logger;
    }

    async search(request: IJobsLookupRequest): Promise<IWorkdayJobsApiResponse> {
        const url = new URL("jobs", this.baseUrl).toString();
        const method = "POST";
        this.logger.trace(`[WorkdayJobsGateway.search] Fetching: ${method} ${url}`);
        const response = await fetch(url, {
            method,
            headers: {
                accept: "application/json",
                "accept-language": "en-US",
                "content-type": "application/json",
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const responseText = await response.text();
            const errMsg = `Workday-based jobs search API returned HTTP ${response.status} ${response.statusText}: ${responseText}`;
            throw new Error(errMsg);
        }

        const responseBody = (await response.json()) as IWorkdayJobsApiResponse | undefined;
        if (!responseBody) {
            throw new Error("Workday-based jobs search API returned an empty body");
        }

        return responseBody;
    }

    async getDetail(detailPath: string): Promise<IWorkdayJobDetailsApiResponse> {
        this.logger.trace(`[WorkdayJobsGateway.getDetail] Retrieving job detail for path: ${detailPath}`);
        const path = detailPath.startsWith("/") ? detailPath.slice(1) : detailPath;
        const url = new URL(path, this.baseUrl).toString();
        const method = "GET";
        this.logger.trace(`[WorkdayJobsGateway.getDetail] Retrieving job detail at ${url}`);
        const response = await fetch(url, {
            method,
            headers: {
                accept: "application/json",
                "accept-language": "en-US",
            },
        });

        if (!response.ok) {
            const errMsg = `Workday-based job page returned HTTP ${response.status} ${response.statusText}`;
            this.logger.error(`[WorkdayJobsGateway.getDetail] ${errMsg}`, {
                url,
                status: response.status,
                statusText: response.statusText,
            });
            throw new Error(errMsg);
        }

        const responseBody = (await response.json()) as IWorkdayJobDetailsApiResponse | undefined;

        if (!responseBody) {
            throw new Error("Workday-based job detail API returned an empty body");
        }

        return responseBody;
    }
}
