import Database from "better-sqlite3";

import { IJobAssessment, JobAssessment, JobAssessmentProps } from "../../../Domain/JobAssessment/IJobAssessment";
import { NotFoundError } from "../../../Application/Common/Errors/NotFoundError";
import { IJobAssessmentRepository } from "./IJobAssessmentRepository";
import { ILogger } from "../../Logging/ILogger";

interface JobAssessmentRow {
    id: string;
    candidate_profile_id: string;
    job_post_id: string;
    created_at: string;
    status: string;
    review_status: string;
    screen_result_json: string | null;
    requirements_json: string | null;
    requirement_matches_json: string | null;
    job_match_score_json: string | null;
}

export class JobAssessmentRepository implements IJobAssessmentRepository {
    private readonly insertAssessmentStatement: Database.Statement;
    private readonly getAssessmentByIdStatement: Database.Statement;
    private readonly getAssessmentByJobPostIdAndCandidateProfileIdStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.insertAssessmentStatement = this.connection.prepare(`
            INSERT INTO job_assessments (
                id, candidate_profile_id, job_post_id, created_at, status, review_status,
                screen_result_json, requirements_json, requirement_matches_json, job_match_score_json
            ) VALUES (
                @id, @candidateProfileId, @jobPostId, @createdAt, @status, @reviewStatus,
                @screenResultJson, @requirementsJson, @requirementMatchesJson, @jobMatchScoreJson
            )
        `);

        this.getAssessmentByIdStatement = this.connection.prepare(`
            SELECT * FROM job_assessments WHERE id = @id LIMIT 1
        `);

        this.getAssessmentByJobPostIdAndCandidateProfileIdStatement = this.connection.prepare(`
            SELECT * FROM job_assessments WHERE job_post_id = @jobPostId AND candidate_profile_id = @candidateProfileId LIMIT 1
        `);
    }
    public async getByJobPostAndCandidateId(
        jobPostId: string,
        candidateProfileId: string
    ): Promise<IJobAssessment | undefined> {
        this.logger.info(
            `[JobAssessmentRepository.getByJobPostAndCandidate] Fetching assessment for job post ${jobPostId} / candidate ${candidateProfileId}`
        );
        const row = this.getAssessmentByJobPostIdAndCandidateProfileIdStatement.get({
            jobPostId,
            candidateProfileId,
        }) as JobAssessmentRow | undefined;

        if (!row) {
            this.logger.debug(
                `[JobAssessmentRepository.getByJobPostAndCandidateId] Assessment not found: ${jobPostId}, ${candidateProfileId}`
            );
            return undefined;
        }

        const assessment = this.mapRowToAssessment(row);
        this.logger.debug(
            `[JobAssessmentRepository.getByJobPostAndCandidateId] Retrieved assessment: ${jobPostId}, ${candidateProfileId}`
        );
        return assessment;
    }

    public async getByJobPostAndCandidateIdOrThrow(
        jobPostId: string,
        candidateProfileId: string
    ): Promise<IJobAssessment> {
        const result = await this.getByJobPostAndCandidateId(jobPostId, candidateProfileId);
        if (!result) {
            this.logger.error(
                `[JobAssessmentRepository.getByJobPostAndCandidateIdOrThrow] Assessment with ID ${jobPostId} / ${candidateProfileId} does not exist.`
            );
            throw new NotFoundError(
                `[JobAssessmentRepository.getByJobPostAndCandidateIdOrThrow] Assessment with ID ${jobPostId} / ${candidateProfileId} does not exist.`,
                "jobPostId / candidateProfileId"
            );
        }
        return result;
    }

    public async getById(id: string): Promise<IJobAssessment | undefined> {
        this.logger.debug(`[JobAssessmentRepository.getById] Getting assessment by ID: ${id}`);

        const row = this.getAssessmentByIdStatement.get({ id }) as JobAssessmentRow | undefined;

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

        const params = {
            id: result.id,
            candidateProfileId: result.candidateProfileId,
            jobPostId: result.jobPostId,
            createdAt: result.createdAt.toISOString(),
            status: result.status,
            reviewStatus: result.reviewStatus,
            screenResultJson: result.screenResult ? JSON.stringify(result.screenResult) : null,
            requirementsJson: result.requirements.length > 0 ? JSON.stringify(result.requirements) : null,
            requirementMatchesJson:
                result.requirementMatches.length > 0 ? JSON.stringify(result.requirementMatches) : null,
            jobMatchScoreJson: result.jobMatchScore ? JSON.stringify(result.jobMatchScore) : null,
        };

        this.insertAssessmentStatement.run(params);

        this.logger.info(`[JobAssessmentRepository.storeAssessment] Stored assessment: ${result.id}`);
        return result;
    }

    private mapRowToAssessment(row: JobAssessmentRow): IJobAssessment {
        const props: JobAssessmentProps = {
            id: row.id,
            candidateProfileId: row.candidate_profile_id,
            jobPostId: row.job_post_id,
            createdAt: new Date(row.created_at),
            status: row.status as "complete" | "incomplete",
            reviewStatus: row.review_status as "unreviewed" | "accepted" | "flagged",
            screenResult: row.screen_result_json ? JSON.parse(row.screen_result_json) : undefined,
            requirements: row.requirements_json ? JSON.parse(row.requirements_json) : [],
            requirementMatches: row.requirement_matches_json ? JSON.parse(row.requirement_matches_json) : [],
            jobMatchScore: row.job_match_score_json ? JSON.parse(row.job_match_score_json) : undefined,
        };

        return new JobAssessment(props);
    }
}
