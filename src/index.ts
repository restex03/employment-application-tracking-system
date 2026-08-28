import "dotenv/config";
import { GroqJobEvaluator } from "./JobEvaluators/Groq/GroqJobEvaluator";
import { profiles } from "./JobCandidateProfile/candidateProfiles";
import { WorkdayJobsGateway } from "./APIs/JobSources/Workday/WorkdayJobsGateway";
import { ConsoleLogger } from "./Application/Common/Logger/Console/ConsoleLogger";
import { workdaySources } from "./Application/WorkdaySources/workdaySources";
import { JobScoringService } from "./Application/Services/JobScoringService";

const logger = new ConsoleLogger();

logger.info("Starting application...");

const request = {
    appliedFacets: {},
    limit: 1,
    offset: 0,
    searchText: "software engineer",
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

        const firstJob = jobsList[0];

        if (!firstJob) {
            logger.info(`No jobs returned for ${source.companyName}`);
            continue;
        }

        logger.info(`Detail Path: ${firstJob.detailPath}`);

        const detail = await gateway.getDetail(firstJob.detailPath);

        const evaluator = new GroqJobEvaluator();

        const scoringService = new JobScoringService(evaluator);

        const [evaluation] = await scoringService.evaluate(profiles.profile_08_23_2026, [detail]);

        const locations =
            detail.locations
                ?.map(location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`)
                .join("\n") ?? "\t- None";

        const locationsCount = detail.locations?.length ?? 0;

        logger.info(`${detail.id ?? "Unknown"}: ${evaluation.overallScore} - ${evaluation.recommendation}`);
        logger.info(`Job Title: ${detail.title}`);

        logger.info(`Requisition ID: ${detail.requisitionId ?? "Unknown"}`);
        logger.info(`Job Locations (${locationsCount}):\n${locations}`);
        logger.info(`Job Description: ${detail.description.slice(0, 150)}...`);
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
