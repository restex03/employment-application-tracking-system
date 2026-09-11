import Database from "better-sqlite3";
import {
    IJobLocationResponse,
    IJobPostDetailResponse,
    IJobPostResponse,
} from "../../../../Application/JobPost/IJobPostResponse";
import { IJobPostQueries } from "../IJobPostQueries";
import { ILogger } from "../../../Logging/ILogger";
import { IJobMatchScore } from "../../../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { JobPostQueryFilters } from "../../../../Application/JobPost/IJobPostResultService";

interface JobPostRow {
    id: string;
    source_id: string;
    requisition_id: string | null;
    title: string;
    detail_path: string;
    locations: string | null;
    days_old: string | null;
    remote_type: string | null;
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
    private readonly getAllStatement: Database.Statement;
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

            LEFT JOIN job_assessments ja
                ON ja.job_post_id = jp.id
            LEFT JOIN job_post_details jpd
                ON jpd.job_post_id = jp.id

            WHERE jp.id = @id
        `);
        this.getAllStatement = this.connection.prepare(`
            SELECT
                jp.id,
                jp.source_id,
                jp.requisition_id,
                jp.title,
                jp.detail_path,
                jp.locations,
                jp.days_old,
                jp.remote_type,
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

            LEFT JOIN job_assessments ja
                ON ja.job_post_id = jp.id
            LEFT JOIN job_post_details jpd
                ON jpd.job_post_id = jp.id

                WHERE (UPPER(@companyName) = '' OR UPPER(js.company_name) LIKE '%' || UPPER(@companyName) || '%')
                    AND (UPPER(@requisitionId) = '' OR UPPER(jp.requisition_id) LIKE '%' || UPPER(@requisitionId) || '%')
                    AND (UPPER(@title) = '' OR UPPER(jp.title) LIKE '%' || UPPER(@title) || '%')
                    AND (UPPER(@location) = '' OR UPPER(jp.locations) LIKE '%' || UPPER(@location) || '%')
                    AND (COALESCE(TRIM(@daysOld), '') = '' OR UPPER(jp.days_old) LIKE '%' || UPPER(TRIM(@daysOld)) || '%')

            ORDER BY jp.created_at DESC
            LIMIT @pageCount OFFSET @offset
        `);

        this.getAllCountStatement = this.connection.prepare(`
            SELECT COUNT(*) as totalCount
            FROM job_posts jp

            JOIN job_sources js
                ON js.id = jp.source_id

                WHERE (UPPER(@companyName) = '' OR UPPER(js.company_name) LIKE '%' || UPPER(@companyName) || '%')
                    AND (UPPER(@requisitionId) = '' OR UPPER(jp.requisition_id) LIKE '%' || UPPER(@requisitionId) || '%')
                    AND (UPPER(@title) = '' OR UPPER(jp.title) LIKE '%' || UPPER(@title) || '%')
                    AND (UPPER(@location) = '' OR UPPER(jp.locations) LIKE '%' || UPPER(@location) || '%')
                    AND (COALESCE(TRIM(@daysOld), '') = '' OR UPPER(jp.days_old) LIKE '%' || UPPER(TRIM(@daysOld)) || '%')
        `);
    }

    async getJobPostTableResults(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        const offset = (pageNumber - 1) * pageCount;
        const queryParams = {
            pageCount,
            offset,
            companyName: queryFilters.companyName?.trim() ?? "",
            requisitionId: queryFilters.requisitionId?.trim() ?? "",
            title: queryFilters.title?.trim() ?? "",
            location: queryFilters.location?.trim() ?? "",
            daysOld: queryFilters.daysOld?.trim() ?? "",
            jobMatchScore: queryFilters.jobMatchScore,
        };
        const rows = this.getAllStatement.all(queryParams) as JobPostRow[];

        const countRow = this.getAllCountStatement.get(queryParams) as { totalCount: number };
        const totalCount = countRow.totalCount;

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
            remoteType: row.remote_type ?? undefined,
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
            datePosted: row.days_old ?? undefined,
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
