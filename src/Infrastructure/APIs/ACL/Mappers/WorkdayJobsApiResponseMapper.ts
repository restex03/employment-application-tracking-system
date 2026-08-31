import { IWorkdayJobsResponse } from "../ApiContracts/IWorkdayJobsResponse";
import { IJobSearchResult } from "../../JobSources/IJobSearchResult";

type WorkdayJobPosting = IWorkdayJobsResponse["jobPostings"][number];

export interface IWorkdayJobsApiResponseMapper {
    map(posting: WorkdayJobPosting): IJobSearchResult;
}

export class WorkdayJobsResponseMapper implements IWorkdayJobsApiResponseMapper {
    public constructor(private readonly companyName: string) {}

    public map(posting: WorkdayJobPosting): IJobSearchResult {
        const requisitionId = this.getRequisitionId(posting.externalPath);

        return {
            jobSourceId: requisitionId ?? posting.externalPath,
            title: posting.title,
            company: this.companyName,
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
