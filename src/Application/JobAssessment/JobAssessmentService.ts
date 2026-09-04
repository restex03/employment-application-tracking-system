import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { IJobSourceRepository } from "../../Infrastructure/Persistence/JobSource/IJobSourceRepository";
import { PipelineStepStatus } from "../Pipelines/IPipelineStepResult";
import { PipelineRunner } from "../Pipelines/PipelineRunner";
import { IJobAssessmentService } from "./IJobAssessmentService";
import { JobAssessmentContext, IJobAssessmentContext } from "./Pipeline/IJobAssessmentContext";
import { IJobRequirementMatch } from "./RequirementMatching/IJobRequirementMatch";

export class JobAssessmentService implements IJobAssessmentService {
    constructor(
        private readonly candidateProfile: ICandidateProfile,
        private readonly pipeline: PipelineRunner<IJobAssessmentContext>,
        private readonly jobSourceRepository: IJobSourceRepository,
        private readonly jobPostRepo: IJobPostRepository,
        private readonly logger: ILogger
    ) {}

    async runAssessment(jobPostId: string): Promise<void> {
        this.logger.info(`[JobAssessmentService.runAssessment] Running assessment for job post: ${jobPostId}`);
        const jobPost = await this.jobPostRepo.getByIdOrThrow(jobPostId);
        const jobSource = await this.jobSourceRepository.getByIdOrThrow(jobPost.sourceId);
        const ctx = new JobAssessmentContext(this.candidateProfile, jobPost, jobSource);

        const result = await this.pipeline.run(ctx);

        // TODO: return result and/or store to db
        if (result.status === PipelineStepStatus.Failed) {
            this.logger.error(`Pipeline failure detected at step ${result.failedStep}`);
            this.logger.error(`\t- Reason: ${result.reason}`);
        } else {
            this.logger.info("Assessment completed successfully.");
            this.printjobAssessmentDetails(ctx);
        }
    }

    private truncate(value: string | null | undefined, maxLength = 120): string {
        if (!value) {
            return "-";
        }

        return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
    }
    private printjobAssessmentDetails(ctx: IJobAssessmentContext): void {
        const reqId = ctx.jobDetail?.requisitionId ?? "Unknown";
        const title = ctx.job.title;
        const postedDate = ctx.job.postedDate;
        const locations =
            ctx
                .jobDetail!.locations?.map(
                    location => `\t- ${location.city ?? "Unknown"}, ${location.country ?? "Unknown"}`
                )
                .join("\n") ?? "\t- None";

        this.logger.info(`${reqId} - ${postedDate} ${title}`);
        this.logger.info(`\t- Requisition ID: ${ctx.jobDetail?.requisitionId ?? "Unknown"}`);
        this.logger.info(`\t- Locations (${ctx.jobDetail?.locations?.length ?? 0}):\n${locations}`);
        this.logger.info(`\t- Description: ${ctx.jobDetail?.description?.slice(0, 150) ?? "Unknown"}...\n`);
        this.printRequirementMatches(ctx.requirementMatches ?? []);
    }
    private printRequirementMatches(matches: IJobRequirementMatch[]): void {
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
                Evidence: this.truncate(match.evidence, 100),
            }))
        );
    }
}
