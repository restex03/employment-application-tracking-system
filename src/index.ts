import { profiles } from "./JobCandidateProfile/candidateProfiles";
import { WorkdaySources } from "./Application/WorkdaySources/workdaySources";
import { LogLevel } from "./Application/Common/Logging/LogLevel";
import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";

console.log("Starting application...");

const jobSources = WorkdaySources.filter(x => x.companyName === "Equifax");
for (const source of jobSources) {
    try {
        const { logger, jobScreeningSvc, jobScoringService, jobFetchService, jobDetailFetchService } =
            buildDependencies(source, LogLevel.Debug);

        logger.info(`\n========== ${source.companyName} ==========`);
        logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);

        const rawJobsList = await jobFetchService.fetchJobs("software engineer");
        if (rawJobsList.length === 0) {
            logger.info(`[index] Skipping ${source.companyName} - no jobs available`);
            continue;
        }

        const screenedJobsList = await jobScreeningSvc.screen(rawJobsList);

        // todo: distill to approve/reject?
        const proceedList = screenedJobsList
            .filter(x => x.disposition === "advance" || x.disposition === "review")
            .map(x => x.job);

        const jobDetailsList = await jobDetailFetchService.fetchJobDetails(proceedList);
        const evaluations = await jobScoringService.score(profiles.profile_08_23_2026, jobDetailsList);

        for (const evaluation of evaluations) {
            logger.info("");
            logger.info("**********************************************************************");
            logger.info("**********************************************************************");
            logger.info(
                `${evaluation.requisitionId ?? "Unknown"}: ${evaluation.overallScore} - ${evaluation.recommendation}`
            );
            logger.info("----------------------------------------------------------------------");
            logger.info(`Summary: ${evaluation.summary}`);
            logger.info("**********************************************************************\n");
        }
    } catch (error) {
        console.error(
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
