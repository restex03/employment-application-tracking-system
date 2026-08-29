import { IJobsRequest } from "../IJobsRequest";
import { IJobSearchResult } from "../IJobSearchResult";
import { IJobPostingDetail } from "../IJobPostingDetail";
import { IJobGateway } from "../IJobSource";
import { ILogger } from "../../../../Application/Common/Logger/ILogger";
import { IWorkdayJobDetailResponse } from "../../ACL/ApiContracts/IWorkdayJobDetailResponse";
import { IWorkdayJobsResponse } from "../../ACL/ApiContracts/IWorkdayJobsResponse";
import { WorkdayJobDetailResponseMapper } from "../../ACL/Mappers/WorkdayJobDetailResponseMapper";

export class WorkdayJobsGateway implements IJobGateway {
    private readonly companyName: string;
    private readonly baseUrl: string;
    private readonly logger: ILogger;

    constructor(opts: { companyName: string; baseUrl: string; logger: ILogger }) {
        this.companyName = opts.companyName;
        this.baseUrl = opts.baseUrl.endsWith("/") ? opts.baseUrl : `${opts.baseUrl}/`;
        this.logger = opts.logger;
    }

    async search(request: IJobsRequest): Promise<IWorkdayJobsResponse> {
        const url = new URL("jobs", this.baseUrl).toString();
        const method = "POST";
        this.logger.debug(`Fetching: ${method} ${url}`);
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

        const responseBody = (await response.json()) as IWorkdayJobsResponse | undefined;
        if (!responseBody) {
            throw new Error("Workday-based jobs search API returned an empty body");
        }

        return responseBody;
    }

    async getDetail(detailPath: string): Promise<IJobPostingDetail> {
        this.logger.debug(`Retrieving job detail for path: ${detailPath}`);
        const path = detailPath.startsWith("/") ? detailPath.slice(1) : detailPath;
        const url = new URL(path, this.baseUrl).toString();
        const method = "GET";
        this.logger.debug(`Retrieving job detail at ${url}`);
        const response = await fetch(url, {
            method,
            headers: {
                accept: "application/json",
                "accept-language": "en-US",
            },
        });

        if (!response.ok) {
            const errMsg = `Workday-based job page returned HTTP ${response.status} ${response.statusText}`;
            this.logger.error(errMsg, { url, status: response.status, statusText: response.statusText });
            throw new Error(errMsg);
        }

        const responseBody = (await response.json()) as IWorkdayJobDetailResponse | undefined;

        if (!responseBody) {
            throw new Error("Workday-based job detail API returned an empty body");
        }

        return new WorkdayJobDetailResponseMapper().map(responseBody);
    }
}
