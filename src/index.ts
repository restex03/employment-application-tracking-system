import "dotenv/config";
import { JobEvaluator } from "./Evaluators/ShortlistEvaluator/JobEvaluator";
import { profiles } from "./JobCandidateProfile/candidateProfiles";
import { WorkdayJobsGateway } from "./APIs/JobSources/Workday/WorkdayJobsGateway";
import { ConsoleLogger } from "./Application/Common/Logger/Console/ConsoleLogger";
import { workdaySources } from "./Application/WorkdaySources/workdaySources";
import { JobScoringService } from "./Application/Services/JobScoringService";
import { OllamaClientConnection } from "./ModelConnections/Ollama/OllamaClientConnection";
import { JobScreener } from "./Evaluators/InitialJobScreener/JobScreener";
import { IJobScreener } from "./Evaluators/InitialJobScreener/IJobScreener";

const logger = new ConsoleLogger();

logger.info("Starting application...");

const client = new OllamaClientConnection();
const screener: IJobScreener = new JobScreener(client, logger);

const request = {
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText: "",
};
const jobSources = workdaySources;
for (const source of jobSources) {
    logger.info(`\n========== ${source.companyName} ==========`);

    try {
        const gateway = new WorkdayJobsGateway({
            companyName: source.companyName,
            baseUrl: source.baseUrl,
            logger,
        });

        const jobsList = await gateway.search(request);

        logger.info(`Found ${jobsList.length} jobs`);

        // Job Screening
        for (const job of jobsList) {
            if (!job) {
                throw new Error(`No jobs returned for ${source.companyName}`);
            }
            const outcome = await screener.screen([job]);
            const result = outcome[0];
            if (!result) {
                throw new Error(`No screening result returned for job ${job.id}`);
            }

            logger.info(`Job Title: ${job.title}`);
            // logger.info(`Job Id: ${job.id}`);
            // logger.info(`Detail Path: ${job.detailPath}`);
            // logger.info(`Locations: ${job.locations?.join(", ") ?? "None"}`);

            logger.info(`Screening Disposition: ${result.disposition}`);
            logger.info(`Screening Reason: ${result.reason}`);
        }

        // const firstJob = jobsList[0];

        // logger.info(`Detail Path: ${firstJob.detailPath}`);

        // const detail = await gateway.getDetail(firstJob.detailPath);

        // const evaluator = new JobEvaluator(client, logger);

        // const scoringService = new JobScoringService(evaluator);

        // const [evaluation] = await scoringService.evaluate(profiles.profile_08_23_2026, [detail]);

        // const locations =
        //     detail.locations
        //         ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
        //         .join("\n") ?? "\t- None";

        // const locationsCount = detail.locations?.length ?? 0;

        // logger.info(`${detail.id ?? "Unknown"}: ${evaluation.overallScore} - ${evaluation.recommendation}`);
        // logger.info(`Job Title: ${detail.title}`);

        // logger.info(`Requisition ID: ${detail.requisitionId ?? "Unknown"}`);
        // logger.info(`Job Locations (${locationsCount}):\n${locations}`);
        // logger.info(`Job Description: ${detail.description.slice(0, 150)}...`);
    } catch (error) {
        logger.error(
            `Failed to retrieve jobs for ${source.companyName}`,
            error instanceof Error
                ? {
                      message: error.message,
                      stack: error.stack,
                  }
                : { error }
        );
    }
}

logger.info("\nFinished checking Workday sources.");
