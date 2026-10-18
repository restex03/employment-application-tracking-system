import Database from "better-sqlite3";
import { Kysely, sql, SqliteDialect } from "kysely";
import {
    IJobLocationResponse,
    IJobPostDetailResponse,
    IJobPostResponse,
} from "../../../../Application/JobPost/IJobPostResponse";
import { IJobPostQueries } from "../IJobPostQueries";
import { ILogger } from "../../../Logging/ILogger";
import { IJobMatchScore } from "../../../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { JobPostQueryFilters } from "../../../../Application/JobPost/IJobPostResultTableService";

interface JobPostRow {
    id: string;
    source_id: string;
    requisition_id: string | null;
    title: string;
    detail_path: string;
    locations: string | null;
    days_old: number | null;
    application_status: string | null;
    dismissed: number;
    status: string | null;
    created_at: string;
    browser_base_url: string;
    job_match_score_json: string | null;

    detail_id: string | null;
    detail_description: string | null;
    detail_employment_type: string | null;
    detail_locations: string | null;
    detail_valid_through: string | null;
    detail_remote_type: string | null;
    detail_applicant_locations: string | null;
}

export class SqliteJobQueries implements IJobPostQueries {
    private readonly getAllStatement: string;
    private readonly getAllCountStatement: Database.Statement;
    private readonly getByIdStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.getByIdStatement = this.connection.prepare(`
            SELECT
                jp.id,
                jp.source_id,
                jp.requisition_id,
                jp.title,
                jp.detail_path,
                jp.locations,
                jp.days_old,
                jp.remote_type,
                jp.dismissed,
                jp.created_at,
                js.browser_base_url,
                ja.job_match_score_json,

                jpd.id AS detail_id,
                jpd.description AS detail_description,
                jpd.employment_type AS detail_employment_type,
                jpd.locations AS detail_locations,
                jpd.valid_through AS detail_valid_through,
                jpd.remote_type AS detail_remote_type,
                jpd.applicant_locations AS detail_applicant_locations

            FROM job_posts jp
            
            JOIN job_sources js
                ON js.id = jp.source_id

            LEFT JOIN (
                SELECT
                    job_post_id,
                    job_match_score_json,
                    ROW_NUMBER() OVER (PARTITION BY job_post_id ORDER BY created_at DESC) AS row_num
                FROM job_assessments
            ) ja
                ON ja.job_post_id = jp.id AND ja.row_num = 1
            LEFT JOIN job_post_details jpd
                ON jpd.job_post_id = jp.id

            WHERE jp.id = @id
        `);
        this.getAllStatement = `
            SELECT
                jp.id,
                jp.source_id,
                jp.requisition_id,
                jp.title,
                jp.detail_path,
                jp.locations,
                jp.days_old,
                japp.status AS application_status,
                jp.dismissed,
                jp.created_at,
                js.browser_base_url,
                ja.job_match_score_json,

                jpd.id AS detail_id,
                jpd.description AS detail_description,
                jpd.employment_type AS detail_employment_type,
                jpd.locations AS detail_locations,
                jpd.valid_through AS detail_valid_through,
                jpd.remote_type AS detail_remote_type,
                jpd.applicant_locations AS detail_applicant_locations

            FROM job_posts jp
            
            JOIN job_sources js
                ON js.id = jp.source_id
            LEFT JOIN job_applications japp
                ON japp.job_post_id = jp.id

            LEFT JOIN (
                SELECT
                    job_post_id,
                    job_match_score_json,
                    ROW_NUMBER() OVER (PARTITION BY job_post_id ORDER BY created_at DESC) AS row_num
                FROM job_assessments
            ) ja
                ON ja.job_post_id = jp.id AND ja.row_num = 1
            LEFT JOIN job_post_details jpd
                ON jpd.job_post_id = jp.id

            WHERE (UPPER(@companyName) = '' OR UPPER(js.company_name) LIKE '%' || UPPER(@companyName) || '%')
                AND (UPPER(@requisitionId) = '' OR UPPER(jp.requisition_id) LIKE '%' || UPPER(@requisitionId) || '%')
                AND (UPPER(@title) = '' OR UPPER(jp.title) LIKE '%' || UPPER(@title) || '%')
                AND (UPPER(@location) = '' OR UPPER(jp.locations) LIKE '%' || UPPER(@location) || '%')
                AND (@daysOld = -1 AND jp.days_old IS NULL) 
                    OR (jp.days_old IS NOT NULL AND jp.days_old <= @daysOld)
                AND (
                    @jobMatchScore IS NULL
                    OR CAST(json_extract(ja.job_match_score_json, '$.score') AS REAL) >= @jobMatchScore
                )
                AND (
                    @applicationStatus IS NULL
                    OR (@applicationStatus = 'NONE' AND japp.status IS NULL)
                    OR (japp.status IS NOT NULL AND japp.status = @applicationStatus)
                )
                AND (@includeDismissed = 1 OR jp.dismissed = 0)
            ORDER BY jp.days_old ASC
            LIMIT @pageCount OFFSET @offset
        `;

        this.getAllCountStatement = this.connection.prepare(`
            SELECT COUNT(*) as totalCount
            FROM job_posts jp

            JOIN job_sources js
                ON js.id = jp.source_id

            LEFT JOIN job_applications japp
                ON japp.job_post_id = jp.id

            LEFT JOIN (
                SELECT
                    job_post_id,
                    job_match_score_json,
                    ROW_NUMBER() OVER (PARTITION BY job_post_id ORDER BY created_at DESC) AS row_num
                FROM job_assessments
            ) ja
                ON ja.job_post_id = jp.id AND ja.row_num = 1

                WHERE (UPPER(@companyName) = '' OR UPPER(js.company_name) LIKE '%' || UPPER(@companyName) || '%')
                    AND (UPPER(@requisitionId) = '' OR UPPER(jp.requisition_id) LIKE '%' || UPPER(@requisitionId) || '%')
                    AND (UPPER(@title) = '' OR UPPER(jp.title) LIKE '%' || UPPER(@title) || '%')
                    AND (UPPER(@location) = '' OR UPPER(jp.locations) LIKE '%' || UPPER(@location) || '%')
                    AND (
                        @daysOld IS NULL
                        OR (@daysOld = -1 AND jp.days_old IS NULL)
                        OR (jp.days_old IS NOT NULL AND jp.days_old <= @daysOld)
                    )
                    AND (
                        @jobMatchScore IS NULL
                        OR CAST(json_extract(ja.job_match_score_json, '$.score') AS REAL) >= @jobMatchScore
                    )
                    AND (
                        @applicationStatus IS NULL
                        OR (@applicationStatus = 'NONE' AND japp.status IS NULL)
                        OR (japp.status IS NOT NULL AND japp.status = @applicationStatus)
                    )
                    AND (@includeDismissed = 1 OR jp.dismissed = 0)
        `);
    }

    async getJobPostTableResults(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        interface JobPostDatabase {
            job_posts: {
                id: string;
                source_id: string;
                requisition_id: string | null;
                title: string;
                detail_path: string;
                locations: string | null;
                days_old: number | null;
                dismissed: number;
                created_at: string;
            };
            job_sources: {
                id: string;
                company_name: string;
                browser_base_url: string;
            };
            job_applications: {
                job_post_id: string;
                status: string | null;
            };
            job_assessments: {
                job_post_id: string;
                job_match_score_json: string | null;
                created_at: string;
            };
            job_post_details: {
                id: string;
                job_post_id: string;
                description: string | null;
                employment_type: string | null;
                locations: string | null;
                valid_through: string | null;
                remote_type: string | null;
                applicant_locations: string | null;
            };
        }

        const offset = (pageNumber - 1) * pageCount;
        const db = new Kysely<JobPostDatabase>({
            dialect: new SqliteDialect({ database: this.connection }),
        });
        const companyName = queryFilters.companyName?.trim() ?? "";
        const requisitionId = queryFilters.requisitionId?.trim() ?? "";
        const title = queryFilters.title?.trim() ?? "";
        const location = queryFilters.location?.trim() ?? "";
        const applicationStatus = queryFilters.applicationStatus?.trim() || null;

        let query = db
            .with("ranked_assessments", qb =>
                qb
                    .selectFrom("job_assessments")
                    .select([
                        "job_post_id",
                        "job_match_score_json",
                        sql<number>`ROW_NUMBER() OVER (PARTITION BY job_post_id ORDER BY created_at DESC)`.as(
                            "row_num"
                        ),
                    ])
            )
            .selectFrom("job_posts as jp")
            .innerJoin("job_sources as js", "js.id", "jp.source_id")
            .leftJoin("job_applications as japp", "japp.job_post_id", "jp.id")
            .leftJoin("ranked_assessments as ja", join =>
                join.onRef("ja.job_post_id", "=", "jp.id").on("ja.row_num", "=", 1)
            )
            .leftJoin("job_post_details as jpd", "jpd.job_post_id", "jp.id");

        if (companyName) {
            query = query.where(
                sql<boolean>`UPPER(js.company_name) LIKE ${`%${companyName.toUpperCase()}%`}`
            );
        }
        if (requisitionId) {
            query = query.where(
                sql<boolean>`UPPER(jp.requisition_id) LIKE ${`%${requisitionId.toUpperCase()}%`}`
            );
        }
        if (title) {
            query = query.where(
                sql<boolean>`UPPER(jp.title) LIKE ${`%${title.toUpperCase()}%`}`
            );
        }
        if (location) {
            query = query.where(
                sql<boolean>`UPPER(jp.locations) LIKE ${`%${location.toUpperCase()}%`}`
            );
        }
        if (queryFilters.daysOld !== undefined) {
            query =
                queryFilters.daysOld === -1
                    ? query.where("jp.days_old", "is", null)
                    : query.where("jp.days_old", "<=", queryFilters.daysOld);
        }
        if (queryFilters.jobMatchScore !== undefined) {
            query = query.where(
                sql<boolean>`CAST(json_extract(ja.job_match_score_json, '$.score') AS REAL) >= ${queryFilters.jobMatchScore}`
            );
        }
        if (applicationStatus === "NONE") {
            query = query.where("japp.status", "is", null);
        } else if (applicationStatus !== null) {
            query = query.where("japp.status", "=", applicationStatus);
        }
        if (!queryFilters.includeDismissed) {
            query = query.where("jp.dismissed", "=", 0);
        }

        const countRow = await query
            .select(sql<number>`COUNT(*)`.as("totalCount"))
            .executeTakeFirstOrThrow();
        const totalCount = countRow.totalCount;

        const rows = await query
            .select([
                "jp.id",
                "jp.source_id",
                "jp.requisition_id",
                "jp.title",
                "jp.detail_path",
                "jp.locations",
                "jp.days_old",
                "japp.status as application_status",
                "jp.dismissed",
                "jp.created_at",
                sql<string | null>`NULL`.as("status"),
                "js.browser_base_url",
                "ja.job_match_score_json",
                "jpd.id as detail_id",
                "jpd.description as detail_description",
                "jpd.employment_type as detail_employment_type",
                "jpd.locations as detail_locations",
                "jpd.valid_through as detail_valid_through",
                "jpd.remote_type as detail_remote_type",
                "jpd.applicant_locations as detail_applicant_locations",
            ])
            .orderBy("jp.days_old", "asc")
            .limit(pageCount)
            .offset(offset)
            .execute();

        this.logger.debug(
            `[SqliteJobRepository.getAll] Retrieved ${rows.length} job posts (page ${pageNumber}, total: ${totalCount})`
        );

        return {
            data: rows.map(row => this.mapJobPost(row)),
            totalCount,
        };
    }

    async getJobPostTableResultById(id: string): Promise<IJobPostResponse | undefined> {
        const result = this.getByIdStatement.get({ id }) as JobPostRow;

        if (!result) {
            return undefined;
        }

        return this.mapJobPost(result);
    }

    async getJobPostTableResultByIdOrThrow(id: string): Promise<IJobPostResponse> {
        const result = this.getByIdStatement.get({ id }) as JobPostRow;

        if (!result) {
            throw new Error(`Job post table result not found for job post ${id}`);
        }

        return this.mapJobPost(result);
    }

    private mapJobPost(row: JobPostRow): IJobPostResponse {
        const result = {
            id: row.id,
            sourceId: row.source_id,
            requisitionId: row.requisition_id ?? undefined,
            title: row.title,
            detailPath: row.detail_path,
            locations: this.parseJson<string[]>(row.locations),
            daysOld: row.days_old ?? undefined,
            createdAt: new Date(row.created_at),
            status: row.status ?? undefined,
            applicationStatus: row.application_status ?? undefined,
            dismissed: !!row.dismissed,
            detail: row.detail_id ? this.mapJobPostDetail(row) : undefined,
            jobLink: JobLinkMapper.mapJobLink(row),
            jobMatchScore: this.extractRawJobMatchScore(row.job_match_score_json) ?? undefined,
        };

        return result;
    }

    private mapJobPostDetail(row: JobPostRow): IJobPostDetailResponse {
        return {
            id: row.detail_id ?? undefined,
            requisitionId: row.requisition_id ?? undefined,
            description: row.detail_description!,
            validThrough: row.detail_valid_through ?? undefined,
            employmentType: row.detail_employment_type ?? undefined,
            locations: this.parseJson<IJobLocationResponse[]>(row.detail_locations),
            remoteType: row.detail_remote_type ?? undefined,
            applicantLocations: this.parseJson<string[]>(row.detail_applicant_locations),
        };
    }

    private parseJson<T>(value: string | null): T | undefined {
        return value ? (JSON.parse(value) as T) : undefined;
    }
    private extractRawJobMatchScore(value: string | null): number | undefined {
        const result = value ? (JSON.parse(value) as IJobMatchScore) : undefined;
        return result?.score;
    }
}

export class JobLinkMapper {
    /** Maps a JobPostRow to a full job link URL string.
     *  Combine the browser base URL and the detail path to form the full job link URL.
     *  browser_base_url from the JobPostRow is used as the base URL, which includes the base path for the job posting.
     *  detail_path is appended to the base URL path to form the complete job link URL.
     */
    static mapJobLink(row: JobPostRow): string {
        const baseUrl = new URL(row.browser_base_url);
        const baseUrlPath = baseUrl.pathname;
        const detailPath = row.detail_path;

        // Remove trailing slash from basePathUrl if present
        const cleanBasePath = baseUrlPath.endsWith("/") ? baseUrlPath.slice(0, -1) : baseUrlPath;

        // Remove leading slash from detailPath if present
        const cleanNewPath = detailPath.startsWith("/") ? detailPath.slice(1) : detailPath;

        // Combine the cleaned base path and detail path
        const aggregatedPath = `${cleanBasePath}/${cleanNewPath}`;
        return new URL(aggregatedPath, baseUrl).toString();
    }
}
