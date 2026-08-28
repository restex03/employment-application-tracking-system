import { IWorkdayJobsResponse } from "../../ACL/Contracts/IWorkdayJobsResponse";
import { IJobsRequest } from "../IJobsRequest";

export interface ICrowdstrikeJobsGateway {
    getJobPostings(request: IJobsRequest): Promise<IWorkdayJobsResponse>;
}

export class CrowdstrikeJobsGateway implements ICrowdstrikeJobsGateway {
    private readonly jobsUrl = "https://crowdstrike.wd5.myworkdayjobs.com/wday/cxs/crowdstrike/crowdstrikecareers/jobs";

    async getJobPostings(request: IJobsRequest): Promise<IWorkdayJobsResponse> {
        const response = await fetch(this.jobsUrl, {
            method: "POST",
            headers: {
                accept: "application/json",
                "accept-language": "en-US",
                "content-type": "application/json",
            },
            body: JSON.stringify(request),
        });

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`CrowdStrike Workday jobs API returned HTTP ${response.status} ${response.statusText}`);
        }
        const responseBody = await response.json();

        const parsed = responseBody as IWorkdayJobsResponse | undefined;

        if (parsed === undefined) {
            throw new Error("CrowdStrike Workday jobs API returned an undefined body");
        }
        return parsed;
    }
}
