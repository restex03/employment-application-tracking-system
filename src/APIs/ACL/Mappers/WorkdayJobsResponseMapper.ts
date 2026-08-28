import { IWorkdayJobsResponse } from "../Contracts/IWorkdayJobsResponse";
import { IJobSearchResult } from "../../Jobs/IJobSearchResult";

type WorkdayJobPosting = IWorkdayJobsResponse["jobPostings"][number];

export class WorkdayJobsResponseMapper {
    public constructor(private readonly companyName: string) {}

    public map(response: IWorkdayJobsResponse): IJobSearchResult[] {
        return response.jobPostings.map(posting => this.mapPosting(posting));
    }

    private mapPosting(posting: WorkdayJobPosting): IJobSearchResult {
        const requisitionId = this.getRequisitionId(posting.externalPath);

        return {
            id: requisitionId ?? posting.externalPath,
            title: posting.title,
            company: this.companyName,
            detailPath: posting.externalPath,
            ...(requisitionId === undefined ? {} : { requisitionId }),
            ...(posting.locationsText ? { locations: [posting.locationsText] } : {}),
            ...(posting.postedOn ? { postedDate: posting.postedOn } : {}),
        };
    }

    private getRequisitionId(externalPath: string): string | undefined {
        return externalPath.match(/(?:JR|R)-?\d+/i)?.[0];
    }
}
