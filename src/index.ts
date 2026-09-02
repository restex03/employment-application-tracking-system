import { profiles } from "./data/candidateProfiles";
import { WorkdaySources } from "./Infrastructure/JobSources/Workday/workdaySources";
import { LogLevel } from "./Infrastructure/Logging/LogLevel";
import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";
import {
    IJobAssessmentContext,
    JobAssessmentContext,
} from "./Application/JobAssessment/Pipeline/IJobAssessmentContext";
import { PipelineRunner } from "./Application/Pipelines/PipelineRunner";
import { ScreenJob } from "./Application/JobAssessment/Pipeline/Steps/ScreenJob";
import { ClassifyJobRequirements } from "./Application/JobAssessment/Pipeline/Steps/ClassifyJobRequirements";
import { ExtractJobRequirements } from "./Application/JobAssessment/Pipeline/Steps/ExtractJobRequirements";
import { FetchJobDetails } from "./Application/JobAssessment/Pipeline/Steps/FetchJobDetail";
import { PipelineStepStatus } from "./Application/Pipelines/IPipelineStepResult";
import { MatchJobRequirements } from "./Application/JobAssessment/Pipeline/Steps/MatchJobRequirements";
import { IJobRequirementMatch } from "./Application/JobAssessment/RequirementMatching/IJobRequirementMatch";

console.log("Starting application...");

// Equifax has only a few software engineer jobs at the moment. using for testing.
const jobSources = WorkdaySources.filter(x => x.companyName === "Equifax");
for (const source of jobSources) {
    try {
        const {
            logger,
            jobFetchService,
            screeningService,
            requirementsExtractionService,
            requirementsClassificationService,
            requirementsMatchingService,
        } = buildDependencies(source, LogLevel.Debug);

        logger.info(`\n========== ${source.companyName} ==========`);
        logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);

        const rawJobsList = await jobFetchService.fetchLookups("software engineer");
        const test = rawJobsList.slice(3, 10);
        if (test.length === 0) {
            logger.info(`[index] Skipping ${source.companyName} - no jobs available`);
            continue;
        }
        for (const job of test) {
            const ctx = new JobAssessmentContext(profiles.profile_08_23_2026, job);
            const jobAssessmentPipeline = new PipelineRunner<IJobAssessmentContext>([
                new ScreenJob(screeningService),
                new FetchJobDetails(jobFetchService),
                new ExtractJobRequirements(requirementsExtractionService),
                new ClassifyJobRequirements(requirementsClassificationService),
                new MatchJobRequirements(requirementsMatchingService),
            ]);
            const result = await jobAssessmentPipeline.run(ctx);

            if (result.status === PipelineStepStatus.Failed) {
                logger.error(`Pipeline failure detected at step ${result.failedStep}`);
                logger.error(`\t- Reason: ${result.reason}`);
            } else {
                const company = result.context.job.company;
                const title = result.context.job.title;
                const postedDate = result.context.job.postedDate;
                const locations =
                    result.context
                        .jobDetail!.locations?.map(
                            location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`
                        )
                        .join("\n") ?? "\t- None";

                logger.info(`${company} - ${postedDate} ${title}`);
                logger.info(`\t- Requisition ID: ${result.context.jobDetail!.requisitionId ?? "Unknown"}`);
                logger.info(`\t- Locations (${result.context.jobDetail!.locations?.length ?? 0}):\n${locations}`);
                logger.info(`\t- Description: ${result.context.jobDetail!.description.slice(0, 150)}...\n`);
                printRequirementMatches(result.context.requirementMatches ?? []);
            }
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

function truncate(value: string | null | undefined, maxLength = 120): string {
    if (!value) {
        return "-";
    }

    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function printRequirementMatches(matches: IJobRequirementMatch[]): void {
    console.log("\nRequirement Analysis");

    if (matches.length === 0) {
        throw new Error(`Expected RequirementMatches, but received empty array.`);
    }
    console.table(
        matches.map((match, index) => ({
            "#": index + 1,
            Requirement: match.requirement.area,
            Category: match.requirement.category,
            Match: match.matchType,
            Evidence: truncate(match.evidence, 100),
        }))
    );
}
