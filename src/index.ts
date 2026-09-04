import "dotenv/config";
import { profiles } from "./data/candidateProfiles";
import { LogLevel } from "./Infrastructure/Logging/LogLevel";
import {
    buildApplicationDependencies,
    buildSourceDependencies,
} from "./Application/DependencyInjection/buildDependencies";
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
import { readFileSync } from "node:fs";
import path from "node:path";
import { IJobSourceRepository, JobSourceInput } from "./Infrastructure/Persistence/JobSource/IJobSourceRepository ";
import { IWorkdayJobSource } from "./Infrastructure/JobSources/Workday/IWorkdayJobSource";

const TEST_MODE = process.env.TEST_MODE === "true" || false;
console.log("Starting application in " + (TEST_MODE ? "test" : "production") + " mode...");

const app = buildApplicationDependencies(LogLevel.Debug);
const workdaySources = await loadWorkdaySources(app.jobSourceRepository);
const jobSources = TEST_MODE ? workdaySources.filter(x => x.companyName === "Walmart") : workdaySources;
try {
    for (const source of jobSources) {
        try {
            const sourceDependencies = buildSourceDependencies(source, app);

            const {
                logger,
                jobPostService,
                screeningService,
                requirementsExtractionService,
                requirementsClassificationService,
                requirementsMatchingService,
            } = app;

            const { jobFetchService } = sourceDependencies;

            logger.info(`\n========== ${source.companyName} ==========`);
            logger.info(`[index] Fetching jobs from ${source.companyName} at ${source.baseUrl}...`);

            const rawJobsList = await jobFetchService.fetchLookups("software engineer");
            // const todoJobs =
            const todoJobs = TEST_MODE ? rawJobsList.slice(0, 10) : rawJobsList;

            await jobPostService.storeDiscoveredJobs(todoJobs);

            if (todoJobs.length === 0) {
                logger.info(`[index] Skipping ${source.companyName} - no jobs available`);
                continue;
            }

            // for (const job of todoJobs) {
            //     const ctx = new JobAssessmentContext(profiles.profile_08_23_2026, job);
            //     const jobAssessmentPipeline = new PipelineRunner<IJobAssessmentContext>([
            //         new ScreenJob(screeningService),
            //         new FetchJobDetails(jobFetchService),
            //         new ExtractJobRequirements(requirementsExtractionService),
            //         new ClassifyJobRequirements(requirementsClassificationService),
            //         new MatchJobRequirements(requirementsMatchingService),
            //     ]);
            //     const result = await jobAssessmentPipeline.run(ctx);

            //     if (result.status === PipelineStepStatus.Failed) {
            //         logger.error(`Pipeline failure detected at step ${result.failedStep}`);
            //         logger.error(`\t- Reason: ${result.reason}`);
            //     } else {
            //         const company = result.context.job.company;
            //         const title = result.context.job.title;
            //         const postedDate = result.context.job.postedDate;
            //         const locations =
            //             result.context
            //                 .jobDetail!.locations?.map(
            //                     location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`
            //                 )
            //                 .join("\n") ?? "\t- None";

            //         logger.info(`${company} - ${postedDate} ${title}`);
            //         logger.info(`\t- Requisition ID: ${result.context.jobDetail!.requisitionId ?? "Unknown"}`);
            //         logger.info(`\t- Locations (${result.context.jobDetail!.locations?.length ?? 0}):\n${locations}`);
            //         logger.info(`\t- Description: ${result.context.jobDetail!.description.slice(0, 150)}...\n`);
            //         printRequirementMatches(result.context.requirementMatches ?? []);
            //     }
            // }
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
} finally {
    app.sqlite.connection.close();
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

export async function loadWorkdaySources(jobSourceRepository: IJobSourceRepository): Promise<IWorkdayJobSource[]> {
    const sourcesPath = path.resolve(process.cwd(), "data", "JobSources", "workdaySources.json");

    const workdaySources = await jobSourceRepository.getAll();

    return Promise.resolve(workdaySources);
}
