import Database from "better-sqlite3";
import { Kysely, sql, SqliteDialect } from "kysely";
import { IJobPostQueries } from "../IJobPostQueries";
import { ILogger } from "../../../Logging/ILogger";
import { IJobMatchScore } from "../../../../Domain/JobAssessment/Scoring/IJobMatchScore";


export interface IAssessmentHydration {
    jobPostId: string;
    requirementMatchScore: number;
}

export interface IApplicationHydration {
    jobPostId: string;
    applicationStatus: string | null;
}


export class SqliteJobQueries implements IJobPostQueries {
    private readonly getJobAssessmentsStatement: string;
    private readonly getJobApplicationsStatement: string;



    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {

        this.getJobApplicationsStatement = `
            SELECT
                job_post_id,
                status AS application_status
            FROM job_applications
            WHERE job_post_id IN (SELECT value FROM json_each(@job_post_ids))
                AND (
                    @applicationStatus IS NULL
                    OR (@applicationStatus = 'NONE' AND status IS NULL)
                    OR status = @applicationStatus
                );
        `;

        this.getJobAssessmentsStatement = `
            SELECT
                job_post_id,
                job_match_score_json
            FROM (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY job_post_id
                        ORDER BY created_at DESC, id DESC
                    ) AS rn
                FROM job_assessments
                WHERE job_post_id IN (SELECT value FROM json_each(@job_post_ids))
            )
            WHERE rn = 1
                AND (
                    @jobMatchScore IS NULL
                    OR json_extract(job_match_score_json, '$.score') >= @jobMatchScore
                );
            
        `;


       
    }
    public async getJobApplications(jobPostIds: string[], applicationStatus: string | undefined): Promise<IApplicationHydration[]> {
        const result = this.connection
            .prepare(this.getJobApplicationsStatement)
            .all({ job_post_ids: JSON.stringify(jobPostIds), applicationStatus: applicationStatus }) as IApplicationHydration[];
        return result;
    }
    public async getJobAssessments(jobPostIds: string[], jobMatchScore: number | undefined): Promise<IAssessmentHydration[]> {
        type IAssessmentRow = {
            jobPostId: string;
            jobMatchScoreJson: string;
        }
        const rows = this.connection
            .prepare(this.getJobAssessmentsStatement)
            .all({ job_post_ids: JSON.stringify(jobPostIds), jobMatchScore: jobMatchScore }) as IAssessmentRow[];
        
        const result = rows.map(x => ({
            jobPostId: x.jobPostId,
            requirementMatchScore: SqliteJobQueries.extractRawJobMatchScoreOrThrow(x.jobMatchScoreJson),
        }));
        return result as IAssessmentHydration[];
    }

    private static extractRawJobMatchScoreOrThrow(value: string | null): number {
        const result = value ? (JSON.parse(value) as IJobMatchScore) : undefined;
        if (!result) {
            throw new Error(`Failed to extract job match score from value: ${value}`)
        }
        return result.score;
    }

}