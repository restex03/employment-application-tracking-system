import { profiles } from "./data/candidateProfiles";
import { WorkdaySources } from "./Infrastructure/JobSources/Workday/workdaySources";
import { LogLevel } from "./Infrastructure/Logging/LogLevel";
import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";

console.log("Starting application...");

// Equifax has only a few software engineer jobs at the moment. using for testing.
const jobSources = WorkdaySources.filter(x => x.companyName === "Equifax");
for (const source of jobSources) {
    try {
        const { logger, jobScreeningSvc, jobScoringService, jobFetchService } = buildDependencies(
            source,
            LogLevel.Debug
        );

        logger.info(`\n========== ${source.companyName} ==========`);
        logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);

        const rawJobsList = await jobFetchService.fetchLookups("software engineer");
        if (rawJobsList.length === 0) {
            logger.info(`[index] Skipping ${source.companyName} - no jobs available`);
            continue;
        }

        const screenedJobsList = await jobScreeningSvc.screen(rawJobsList);

        // todo: distill to approve/reject?
        const proceedList = screenedJobsList
            .filter(x => x.disposition === "advance" || x.disposition === "review")
            .map(x => x.job);

        const jobDetailsList = await jobFetchService.fetchDetails(proceedList);
        const evaluations = await jobScoringService.score(profiles.profile_08_23_2026, jobDetailsList);

        for (const evaluation of evaluations) {
            logger.info(`${evaluation.title}`);
            // logger.info(`\t- Overall Score: ${evaluation.overallScore()}`);
            // logger.info(`\t\t- Career Growth: ${evaluation.scores.careerGrowth}`);
            // logger.info(`\t\t- Skill Fit: ${evaluation.scores.currentSkillFit}`);
            // logger.info(`\t\t- Experience Fit: ${evaluation.scores.experienceFit}`);
            // logger.info(`\t\t- Skill Portability: ${evaluation.scores.skillPortability}`);
            // logger.info(`\t\t- Work Fit: ${evaluation.scores.workFit}`);
            logger.info(`\t- Strengths (${evaluation.strengths.length}):`);
            evaluation.strengths.forEach(x => {
                logger.info(`\t\t- Area: ${x.area}`);
                logger.info(`\t\t\t- Type : ${x.type}`);
                logger.info(`\t\t\t- Reason: ${x.reason}`);
            });
            logger.info(`\t- Gaps (${evaluation.gaps.length}):`);
            evaluation.gaps.forEach(x => {
                logger.info(`\t\t- Area: ${x.area}`);
                logger.info(`\t\t\t- Category: ${x.category}`);
                logger.info(`\t\t\t- Severity: ${x.severity}`);
                logger.info(`\t\t\t- Reason: ${x.reason}`);
            });
            logger.info(` \n`);
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
