import { IWorkdayJobDetailsApiResponse } from "../Contracts/IWorkdayJobDetailsApiResponse";
import { IJobPostDetail, IJobLocation } from "../../../../Domain/JobPosts/IJobPostDetail";
import sanitizeHtml from "sanitize-html";

export interface IWorkdayJobDetailsApiResponseMapper {
    map(response: IWorkdayJobDetailsApiResponse): IJobPostDetail;
}
export class WorkdayJobDetailsApiResponseMapper implements IWorkdayJobDetailsApiResponseMapper {
    public map(response: IWorkdayJobDetailsApiResponse): IJobPostDetail {
        const { jobPostingInfo } = response;

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
            description: this.sanitize(jobPostingInfo.jobDescription),
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

    private sanitize(html: string): string {
        const clean = sanitizeHtml(html, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
            allowedAttributes: {
                a: ["href", "target"],
                img: ["src", "alt"],
            },
        });
        return clean;
    }
}
