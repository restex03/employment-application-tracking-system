import { IJobPostDetail } from "../../../../Domain/JobPosts/IJobPostDetail";
import { IJobPostLookup } from "../../../../Domain/JobPosts/IJobPostLookup";
import { IJobGateway } from "../../../../Domain/JobPosts/IJobSource";
import {
    IWorkdayJobDetailsApiResponseMapper,
    WorkdayJobDetailsApiResponseMapper,
} from "../../../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobDetailsApiResponseMapper";
import { ILogger } from "../../../Common/Logging/ILogger";
import { IJobDetailFetchService } from "../IJobDetailFetchService";

export class WorkdayJobDetailFetchService implements IJobDetailFetchService {
    constructor(
        private readonly jobGateway: IJobGateway,
        private readonly jobDetailMapper: IWorkdayJobDetailsApiResponseMapper,
        private readonly logger: ILogger
    ) {}

    async fetchJobDetails(lookups: IJobPostLookup[]): Promise<IJobPostDetail[]> {
        this.logger.info(`[WorkdayJobDetailFetchService.fetchJobDetails] Fetching details: ${lookups.length} jobs.`);
        const jobDetailsList: IJobPostDetail[] = [];

        for (const result of lookups) {
            this.logger.info(
                `[WorkdayJobDetailFetchService.fetchJobDetails] Fetching details: ${result.company} - ${result.jobSourceId} (${result.title})`
            );
            const apiResult = await this.jobGateway.getDetail(result.detailPath);
            const jobDetail = new WorkdayJobDetailsApiResponseMapper().map(apiResult);
            const locations =
                jobDetail.locations
                    ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
                    .join("\n") ?? "\t- None";

            this.logger.info(`\t- Title: ${jobDetail.title}`);
            this.logger.info(`\t- Requisition ID: ${jobDetail.requisitionId ?? "Unknown"}`);
            this.logger.info(`\t- Locations (${jobDetail.locations?.length ?? 0}):\n${locations}`);
            this.logger.info(`\t- Description: ${jobDetail.description.slice(0, 150)}...\n`);
            jobDetailsList.push(jobDetail);
        }

        return jobDetailsList;
    }
}
