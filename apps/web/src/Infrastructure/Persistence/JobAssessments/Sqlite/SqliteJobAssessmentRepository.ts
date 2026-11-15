import { and, desc, eq } from "drizzle-orm";

import {
    IJobAssessment,
    JobAssessment,
    JobAssessmentProps,
    JobAssessmentReviewStatus,
} from "../../../../Domain/JobAssessment/IJobAssessment";
import { NotFoundError } from "../../../../Application/Common/Errors/NotFoundError";
import { IJobAssessmentRepository } from "../IJobAssessmentRepository";
import { ILogger } from "../../../Logging/ILogger";
import { jobAssessments } from "../../Drizzle/schema";
import type { AppDatabase } from "../../SqliteDatabaseProvider";

export class SqliteJobAssessmentRepository implements IJobAssessmentRepository {
    constructor(
        private readonly database: AppDatabase,
        private readonly logger: ILogger
    ) {}
    public async getLatestAssessment(
        jobPostId: string,
        candidateProfileId: string
    ): Promise<IJobAssessment | undefined> {
        this.logger.info(
            `[JobAssessmentRepository.getLatestAssessment] Fetching assessment for job post ${jobPostId} / candidate ${candidateProfileId}`
        );
        const [row] = await this.database
            .select()
            .from(jobAssessments)
            .where(
                and(eq(jobAssessments.jobPostId, jobPostId), eq(jobAssessments.candidateProfileId, candidateProfileId))
            )
            .orderBy(desc(jobAssessments.createdAt), desc(jobAssessments.id))
            .limit(1);

        if (!row) {
            this.logger.debug(
                `[JobAssessmentRepository.getLatestAssessment] Assessment not found for job post ${jobPostId} and candidate ${candidateProfileId}`
            );
            return undefined;
        }

        const assessment = this.mapRowToAssessment(row);
        this.logger.debug(
            `[JobAssessmentRepository.getLatestAssessment] Retrieved assessment for job post ${jobPostId} and candidate ${candidateProfileId}`
        );
        return assessment;
    }

    public async getLatestAssessmentOrThrow(jobPostId: string, candidateProfileId: string): Promise<IJobAssessment> {
        const result = await this.getLatestAssessment(jobPostId, candidateProfileId);
        if (!result) {
            throw new NotFoundError(
                `[JobAssessmentRepository.getLatestAssessmentOrThrow] Assessment with ID ${jobPostId} / ${candidateProfileId} does not exist.`,
                "jobPostId / candidateProfileId"
            );
        }
        return result;
    }

    public async getById(id: string): Promise<IJobAssessment | undefined> {
        this.logger.debug(`[JobAssessmentRepository.getById] Getting assessment by ID: ${id}`);

        const [row] = await this.database.select().from(jobAssessments).where(eq(jobAssessments.id, id)).limit(1);

        if (!row) {
            this.logger.debug(`[JobAssessmentRepository.getById] Assessment not found: ${id}`);
            return undefined;
        }

        const assessment = this.mapRowToAssessment(row);
        this.logger.debug(`[JobAssessmentRepository.getById] Retrieved assessment: ${id}`);
        return assessment;
    }

    public async getByIdOrThrow(id: string): Promise<IJobAssessment> {
        const result = await this.getById(id);
        if (!result) {
            this.logger.error(`[JobAssessmentRepository.getByIdOrThrow] Assessment with ID ${id} does not exist.`);
            throw new NotFoundError(
                `[JobAssessmentRepository.getByIdOrThrow] Assessment with ID ${id} does not exist.`,
                "id"
            );
        }
        return result;
    }

    public async storeAssessment(result: IJobAssessment): Promise<IJobAssessment> {
        this.logger.debug(`[JobAssessmentRepository.storeAssessment] Storing assessment: ${result.id}`);

        await this.database.insert(jobAssessments).values({
            id: result.id,
            candidateProfileId: result.candidateProfileId,
            jobPostId: result.jobPostId,
            createdAt: result.createdAt.toISOString(),
            status: result.status,
            reviewStatus: result.reviewStatus,
            screenResult: result.screenResult ?? null,
            requirements: result.requirements.length > 0 ? [...result.requirements] : null,
            requirementMatches: result.requirementMatches.length > 0 ? [...result.requirementMatches] : null,
            jobMatchScore: result.jobMatchScore ?? null,
        });

        this.logger.info(`[JobAssessmentRepository.storeAssessment] Stored assessment: ${result.id}`);
        return result;
    }

    public async updateReviewStatus(id: string, reviewStatus: JobAssessmentReviewStatus): Promise<void> {
        this.logger.debug(`[JobAssessmentRepository.updateReviewStatus] Updating review status for assessment: ${id}`);
        await this.database.update(jobAssessments).set({ reviewStatus }).where(eq(jobAssessments.id, id));
        this.logger.info(`[JobAssessmentRepository.updateReviewStatus] Updated review status for assessment: ${id}`);
    }

    private mapRowToAssessment(row: typeof jobAssessments.$inferSelect): IJobAssessment {
        const props: JobAssessmentProps = {
            id: row.id,
            candidateProfileId: row.candidateProfileId,
            jobPostId: row.jobPostId,
            createdAt: new Date(row.createdAt),
            status: row.status,
            reviewStatus: row.reviewStatus,
            screenResult: row.screenResult ?? undefined,
            requirements: row.requirements ?? [],
            requirementMatches: row.requirementMatches ?? [],
            jobMatchScore: row.jobMatchScore ?? undefined,
        };

        return new JobAssessment(props);
    }
}
