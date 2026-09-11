import { IWorkdayJobsApiResponse } from "../Contracts/IWorkdayJobsApiResponse";
import { IJobPostDiscovery } from "../../../../Domain/JobPosts/IJobPostDiscovery";
import { WorkdayDaysOldNormalizer } from "./WorkdayDaysOldNormalizer";
import { ILogger } from "../../../Logging/ILogger";

type WorkdayJobPosting = IWorkdayJobsApiResponse["jobPostings"][number];

export interface IWorkdayJobsApiResponseMapper {
    map(posting: WorkdayJobPosting): IJobPostDiscovery | null;
}

export class WorkdayJobsResponseMapper implements IWorkdayJobsApiResponseMapper {
    private readonly daysOldNormalizer = new WorkdayDaysOldNormalizer();

    public constructor(
        private readonly jobSourceId: string,
        private readonly logger: ILogger
    ) {}

    public map(posting: WorkdayJobPosting): IJobPostDiscovery | null {
        if (!posting.title || !posting.externalPath) {
            this.logger.warn(
                `[WorkdayJobsResponseMapper] Job posting has missing or empty title or externalPath.` +
                    `\n\t- externalPath: ${posting.externalPath ?? "N/A"}` +
                    `\n\t- job post json: ${JSON.stringify(posting)}`
            );
            return null;
        }

        let requisitionId = this.getRequisitionId(posting.externalPath);
        requisitionId ??= posting.externalPath;
        return {
            sourceId: this.jobSourceId,
            title: posting.title,
            detailPath: posting.externalPath,
            ...(requisitionId === undefined ? {} : { requisitionId }),
            ...(posting.locationsText ? { locations: [posting.locationsText] } : {}),
            ...(posting.postedOn ? { daysOld: this.daysOldNormalizer.normalize(posting.postedOn) } : {}),
            ...(posting.remoteType ? { remoteType: posting.remoteType } : {}),
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
