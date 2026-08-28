import { IWorkdayJobDetailResponse } from "../Contracts/IWorkdayJobDetailResponse";
import { IJobPostingDetail, IJobLocation } from "../../Jobs/IJobPostingDetail";

export class WorkdayJobDetailResponseMapper {
    public map(response: IWorkdayJobDetailResponse): IJobPostingDetail {
        const { jobPostingInfo, hiringOrganization } = response;
        const locations = [jobPostingInfo.location, ...(jobPostingInfo.additionalLocations ?? [])]
            .filter(Boolean)
            .map(location => this.mapLocation(location, jobPostingInfo.country.descriptor));

        return {
            id: jobPostingInfo.id,
            requisitionId: jobPostingInfo.jobReqId,
            title: jobPostingInfo.title,
            description: jobPostingInfo.jobDescription,
            company: hiringOrganization.name,
            datePosted: jobPostingInfo.postedOn,
            employmentType: jobPostingInfo.timeType,
            locations: new Array(...new Set(locations)),
        };
    }

    private mapLocation(location: string, country: string): IJobLocation {
        return {
            city: location,
            country,
        };
    }
}
