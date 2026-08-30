import { IWorkdayJobDetailsApiResponseMapper } from "../../../../Infrastructure/APIs/ACL/Mappers/WorkdayJobDetailResponseMapper";
import { IJobPostingDetail } from "../../../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { IJobSearchResult } from "../../../../Infrastructure/APIs/JobSources/IJobSearchResult";
import { IJobGateway } from "../../../../Infrastructure/APIs/JobSources/IJobSource";
import { ILogger } from "../../../Common/Logging/ILogger";
import { IJobDetailFetchService } from "../IJobDetailFetchService";

export class WorkdayJobDetailFetchService implements IJobDetailFetchService {
    constructor(
        private readonly jobGateway: IJobGateway,
        private readonly jobDetailMapper: IWorkdayJobDetailsApiResponseMapper,
        private readonly logger: ILogger
    ) {}

    async fetchJobDetails(lookups: IJobSearchResult[]): Promise<IJobPostingDetail[]> {
        this.logger.info(`[WorkdayJobDetailFetchService.fetchJobDetails] Fetching details: ${lookups.length} jobs.`);
        const jobDetailsList: IJobPostingDetail[] = [];

        for (const result of lookups) {
            this.logger.info(
                `[WorkdayJobDetailFetchService.fetchJobDetails] Fetching details: ${result.company} - ${result.id} (${result.title})`
            );
            const jobDetail: IJobPostingDetail = await this.jobGateway.getDetail(result.detailPath);
            const locations =
                jobDetail.locations
                    ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
                    .join("\n") ?? "\t- None";

            this.logger.info(`Job Title: ${jobDetail.title}`);
            this.logger.info(`Requisition ID: ${jobDetail.requisitionId ?? "Unknown"}`);
            this.logger.info(`Job Locations (${jobDetail.locations?.length ?? 0}):\n${locations}`);
            this.logger.info(`Job Description: ${jobDetail.description.slice(0, 150)}...`);
            jobDetailsList.push(jobDetail);
        }

        return jobDetailsList;
    }
}
