import { and, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { IJobPostResponse } from "../../../../Application/JobPost/IJobPostResponse";
import { JobPostQueryFilters } from "../../../../Application/JobPost/IJobPostService";
import { ILogger } from "../../../Logging/ILogger";
import { jobApplications } from "../../JobApplications/Drizzle/jobApplicationsSchema";
import { jobAssessments } from "../../JobAssessments/Drizzle/jobAssessmentsSchema";
import { createJobPostFilters, createJobPostOrderBy } from "../Drizzle/jobPostQueryExpressions";
import { jobPosts } from "../Drizzle/jobPostsSchema";
import { IApplicationHydration, IAssessmentHydration, IJobPostQueries } from "../IJobPostQueries";

const schema = { jobApplications, jobAssessments, jobPosts };
type JobQueriesDatabase = BetterSQLite3Database<typeof schema>;

const matchScore = sql<number | null>`json_extract(${jobAssessments.jobMatchScore}, '$.score')`;

export class SqliteJobQueries implements IJobPostQueries {
    private readonly database: JobQueriesDatabase;

    constructor(
        connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.database = drizzle(connection, { schema, casing: "snake_case" });
    }

    public async getJobPostsForClient(
        pageCount: number,
        pageNumber: number,
        queryFilters: JobPostQueryFilters
    ): Promise<{ data: IJobPostResponse[]; totalCount: number }> {
        if (!Number.isSafeInteger(pageCount) || pageCount < 1 || !Number.isSafeInteger(pageNumber) || pageNumber < 1) {
            throw new RangeError("pageCount and pageNumber must be positive integers.");
        }

        const latestAssessments = this.database
            .select({
                jobPostId: jobAssessments.jobPostId,
                jobMatchScore: jobAssessments.jobMatchScore,
                rank: sql<number>`row_number() over (
                    partition by ${jobAssessments.jobPostId}
                    order by ${jobAssessments.createdAt} desc, ${jobAssessments.id} desc
                )`.as("assessment_rank"),
            })
            .from(jobAssessments)
            .as("latest_assessments");
        const latestApplications = this.database
            .select({
                jobPostId: jobApplications.jobPostId,
                status: jobApplications.status,
                rank: sql<number>`row_number() over (
                    partition by ${jobApplications.jobPostId}
                    order by ${jobApplications.createdAt} desc, ${jobApplications.id} desc
                )`.as("application_rank"),
            })
            .from(jobApplications)
            .as("latest_applications");

        const filters = createJobPostFilters(queryFilters);
        const joinedScore = sql<number | null>`json_extract(${latestAssessments.jobMatchScore}, '$.score')`;
        if (queryFilters.applicationStatus !== undefined) {
            filters.push(
                queryFilters.applicationStatus === "NONE"
                    ? isNull(latestApplications.status)
                    : sql`${latestApplications.status} = ${queryFilters.applicationStatus}`
            );
        }
        if (queryFilters.jobMatchScore !== undefined) {
            filters.push(gte(joinedScore, queryFilters.jobMatchScore));
        }
        const where = filters.length > 0 ? and(...filters) : undefined;

        const [{ totalCount }] = await this.database
            .select({ totalCount: sql<number>`count(distinct ${jobPosts.id})` })
            .from(jobPosts)
            .leftJoin(
                latestAssessments,
                and(eq(jobPosts.id, latestAssessments.jobPostId), eq(latestAssessments.rank, 1))
            )
            .leftJoin(
                latestApplications,
                and(eq(jobPosts.id, latestApplications.jobPostId), eq(latestApplications.rank, 1))
            )
            .where(where);

        const rows = await this.database
            .select({
                jobPost: jobPosts,
                applicationStatus: latestApplications.status,
                requirementMatchScore: joinedScore,
            })
            .from(jobPosts)
            .leftJoin(
                latestAssessments,
                and(eq(jobPosts.id, latestAssessments.jobPostId), eq(latestAssessments.rank, 1))
            )
            .leftJoin(
                latestApplications,
                and(eq(jobPosts.id, latestApplications.jobPostId), eq(latestApplications.rank, 1))
            )
            .where(where)
            .orderBy(...createJobPostOrderBy(queryFilters))
            .limit(pageCount)
            .offset((pageNumber - 1) * pageCount);

        return {
            totalCount,
            data: rows.map(({ jobPost, applicationStatus, requirementMatchScore }) => ({
                ...jobPost,
                requisitionId: jobPost.requisitionId ?? undefined,
                remoteType: jobPost.remoteType ?? undefined,
                applicationStatus: applicationStatus ?? undefined,
                requirementMatchScore: requirementMatchScore ?? undefined,
            })),
        };
    }

    public async getJobApplications(
        jobPostIds: string[],
        applicationStatus: string | undefined
    ): Promise<IApplicationHydration[]> {
        if (jobPostIds.length === 0) {
            return [];
        }

        this.logger.debug(`[SqliteJobQueries.getJobApplications] Fetching applications for ${jobPostIds.length} posts`);
        const latestApplications = this.database
            .select({
                jobPostId: jobApplications.jobPostId,
                status: jobApplications.status,
                rank: sql<number>`row_number() over (
                    partition by ${jobApplications.jobPostId}
                    order by ${jobApplications.createdAt} desc, ${jobApplications.id} desc
                )`.as("application_rank"),
            })
            .from(jobApplications)
            .where(inArray(jobApplications.jobPostId, jobPostIds))
            .as("latest_applications");
        const rows = await this.database
            .select({
                jobPostId: latestApplications.jobPostId,
                applicationStatus: latestApplications.status,
            })
            .from(latestApplications)
            .where(
                and(
                    eq(latestApplications.rank, 1),
                    applicationStatus !== undefined && applicationStatus !== "NONE"
                        ? sql`${latestApplications.status} = ${applicationStatus}`
                        : undefined
                )
            );
        if (applicationStatus === "NONE") {
            const foundJobPostIds = new Set(rows.map(row => row.jobPostId));
            return jobPostIds
                .filter(jobPostId => !foundJobPostIds.has(jobPostId))
                .map(jobPostId => ({ jobPostId, applicationStatus: null }));
        }

        return rows.map(row => ({
            jobPostId: row.jobPostId,
            applicationStatus: row.applicationStatus,
        }));
    }

    public async getJobAssessments(
        jobPostIds: string[],
        jobMatchScore: number | undefined
    ): Promise<IAssessmentHydration[]> {
        if (jobPostIds.length === 0) {
            return [];
        }

        this.logger.debug(`[SqliteJobQueries.getJobAssessments] Fetching assessments for ${jobPostIds.length} posts`);
        const latestAssessments = this.database
            .select({
                jobPostId: jobAssessments.jobPostId,
                score: matchScore.as("score"),
                rank: sql<number>`row_number() over (
                    partition by ${jobAssessments.jobPostId}
                    order by ${jobAssessments.createdAt} desc, ${jobAssessments.id} desc
                )`.as("assessment_rank"),
            })
            .from(jobAssessments)
            .where(inArray(jobAssessments.jobPostId, jobPostIds))
            .as("latest_assessments");
        const rows = await this.database
            .select({
                jobPostId: latestAssessments.jobPostId,
                requirementMatchScore: latestAssessments.score,
            })
            .from(latestAssessments)
            .where(
                and(
                    eq(latestAssessments.rank, 1),
                    isNotNull(latestAssessments.score),
                    jobMatchScore !== undefined ? gte(latestAssessments.score, jobMatchScore) : undefined
                )
            );

        return rows.flatMap(row =>
            row.requirementMatchScore === null
                ? []
                : [{ jobPostId: row.jobPostId, requirementMatchScore: row.requirementMatchScore }]
        );
    }
}
