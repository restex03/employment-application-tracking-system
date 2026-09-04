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
            company: this.jobSourceId,
            detailPath: posting.externalPath,
            ...(requisitionId === undefined ? {} : { requisitionId }),
            ...(posting.locationsText ? { locations: [posting.locationsText] } : {}),
            ...(posting.postedOn ? { postedDate: posting.postedOn } : {}),
        };
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
