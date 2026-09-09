import { IWorkdayJobsApiResponse } from "../Contracts/IWorkdayJobsApiResponse";
import { IJobPostDiscovery } from "../../../../Domain/JobPosts/IJobPostDiscovery";

type WorkdayJobPosting = IWorkdayJobsApiResponse["jobPostings"][number];

export interface IWorkdayJobsApiResponseMapper {
    map(posting: WorkdayJobPosting): IJobPostDiscovery;
}

export class WorkdayJobsResponseMapper implements IWorkdayJobsApiResponseMapper {
    public constructor(private readonly jobSourceId: string) {}

    public map(posting: WorkdayJobPosting): IJobPostDiscovery {
        let requisitionId = this.getRequisitionId(posting.externalPath);
        requisitionId ??= posting.externalPath;
        return {
            sourceId: this.jobSourceId,
            title: posting.title,
            detailPath: posting.externalPath,
            ...(requisitionId === undefined ? {} : { requisitionId }),
            ...(posting.locationsText ? { locations: [posting.locationsText] } : {}),
            ...(posting.postedOn ? { postedDaysAgo: this.normalizeDaysAgo(posting.postedOn) } : {}),
            ...(posting.remoteType ? { remoteType: posting.remoteType } : {}),
        };
    }
    normalizeDaysAgo(postedOn: string): string {
        if (postedOn === "Posted Today") {
            return "0";
        }

        const match = postedOn.match(/^Posted (\d+) Days Ago$/);
        if (match) {
            return match[1];
        }

        // For "30+ Days Ago", return "30+"
        if (postedOn.includes("30+ Days Ago")) {
            return "30+";
        }

        return "Unknown";
    }

    private getRequisitionId(externalPath: string): string | undefined {
        const tail = externalPath?.split("_").at(-1);

        if (!tail) {
            return undefined;
        }

        const match = tail.match(/^(JR-?\d+|R-?\d+|J\d+|P\d+|\d{2}WD\d+|\d+)(?:-\d+)?$/i);

        return match?.[1];
    }
}
