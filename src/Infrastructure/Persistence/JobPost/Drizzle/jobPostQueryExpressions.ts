import { asc, desc, gt, gte, sql, type SQL } from "drizzle-orm";
import { JobPostQueryFilters } from "../../../../Application/JobPost/IJobPostService";
import { jobPosts } from "./jobPostsSchema";

export function createJobPostFilters(queryFilters: JobPostQueryFilters): SQL[] {
    const filters: SQL[] = [];
    if (queryFilters.companyName.trim()) {
        filters.push(containsIgnoreCase(jobPosts.companyName, queryFilters.companyName));
    }
    if (queryFilters.requisitionId.trim()) {
        filters.push(containsIgnoreCase(jobPosts.requisitionId, queryFilters.requisitionId));
    }
    if (queryFilters.title.trim()) {
        filters.push(containsIgnoreCase(jobPosts.title, queryFilters.title));
    }
    if (queryFilters.location.trim()) {
        filters.push(sql`EXISTS (
            SELECT 1
            FROM json_each(${jobPosts.locations})
            WHERE instr(lower(value), lower(${queryFilters.location.trim()})) > 0
        )`);
    }
    if (queryFilters.postedDate) {
        filters.push(gte(sql`julianday(${jobPosts.postedDate})`, sql`julianday(${queryFilters.postedDate})`));
    }

    return filters;
}

export function createJobPostOrderBy(queryFilters: JobPostQueryFilters): SQL[] {
    const direction = queryFilters.sortDirection === "asc" ? asc : desc;
    const sortBy = queryFilters.sortBy ?? "postedDate";
    const sortColumn = {
        companyName: jobPosts.companyName,
        requisitionId: jobPosts.requisitionId,
        title: jobPosts.title,
        postedDate: jobPosts.postedDate,
    }[sortBy];
    const normalizedSortColumn = sql`lower(${sortColumn})`;
    const missingValue = sql`CASE WHEN ${sortColumn} IS NULL OR ${sortColumn} = '' THEN 1 ELSE 0 END`;

    return sortBy === "postedDate"
        ? [asc(missingValue), direction(sql`julianday(${sortColumn})`), asc(jobPosts.id)]
        : [asc(missingValue), direction(normalizedSortColumn), asc(jobPosts.id)];
}

function containsIgnoreCase(
    column: typeof jobPosts.companyName | typeof jobPosts.requisitionId | typeof jobPosts.title,
    value: string
): SQL {
    return gt(sql`instr(lower(${column}), lower(${value.trim()}))`, 0);
}
