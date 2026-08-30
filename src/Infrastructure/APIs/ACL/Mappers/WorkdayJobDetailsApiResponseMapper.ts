import { IWorkdayJobDetailsApiResponse } from "../ApiContracts/IWorkdayJobDetailResponse";
import { IJobPostingDetail, IJobLocation } from "../../JobSources/IJobPostingDetail";

export interface IWorkdayJobDetailsApiResponseMapper {
    map(response: IWorkdayJobDetailsApiResponse): IJobPostingDetail;
}
export class WorkdayJobDetailsApiResponseMapper implements IWorkdayJobDetailsApiResponseMapper {
    public map(response: IWorkdayJobDetailsApiResponse): IJobPostingDetail {
        const { jobPostingInfo, hiringOrganization } = response;

        const locations: IJobLocation[] = [
            ...(jobPostingInfo.location
                ? [this.mapLocation(jobPostingInfo.location, jobPostingInfo.country?.descriptor)]
                : []),
            ...(jobPostingInfo.additionalLocations ?? []).filter(Boolean).map(location => this.mapLocation(location)),
        ];

        const uniqueLocations = [
            ...new Map(
                locations.map(location => [
                    `${location.city ?? ""}|${location.state ?? ""}|${location.country ?? ""}`,
                    location,
                ])
            ).values(),
        ];

        return {
            id: jobPostingInfo.id,
            requisitionId: jobPostingInfo.jobReqId,
            title: jobPostingInfo.title,
            description: jobPostingInfo.jobDescription,
            company: hiringOrganization.name,
            datePosted: jobPostingInfo.postedOn,
            employmentType: jobPostingInfo.timeType,
            locations: uniqueLocations,
        };
    }

    private mapLocation(location: string, country?: string): IJobLocation {
        return {
            city: location,
            ...(country ? { country } : {}),
        };
    }
}
