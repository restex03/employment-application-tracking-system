import { useState } from "react";
import { IJobPost, IJobPostsResponse, PaginationParams, QueryFilterParams } from "../types/JobPost";
import { useAbortableFetch } from "./useAbortableFetch";

interface JobPostsResult {
    posts: IJobPost[];
    totalCount: number;
}

export function useJobPosts(initialParams?: PaginationParams, queryParams?: QueryFilterParams) {
    const [pagination, setPagination] = useState<PaginationParams>(
        initialParams || {
            pageNumber: 1,
            pageCount: 10,
        }
    );
    const { data, loading, error } = useAbortableFetch<JobPostsResult>(
        async signal => {
            const url = new URL("/api/v1/job-posts", window.location.origin);
            url.searchParams.append("pageNumber", pagination.pageNumber.toString());
            url.searchParams.append("pageCount", pagination.pageCount.toString());
            const filterEntries: Array<[keyof QueryFilterParams, string]> = [
                ["companyName", queryParams?.companyName ?? ""],
                ["requisitionId", queryParams?.requisitionId ?? ""],
                ["title", queryParams?.title ?? ""],
                ["location", queryParams?.location ?? ""],
                ["daysOld", queryParams?.daysOld ?? ""],
                ["jobScore", queryParams?.jobScore ?? ""],
            ];
            for (const [key, value] of filterEntries) {
                const normalizedValue = value.trim();
                if (normalizedValue) {
                    url.searchParams.append(key, normalizedValue);
                }
            }

            const response = await fetch(url.toString(), { signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData: IJobPostsResponse = await response.json();
            const posts = responseData.data.map((post: IJobPost) => ({
                ...post,
                createdAt: typeof post.createdAt === "string" ? post.createdAt : new Date(post.createdAt).toISOString(),
            }));

            return { posts, totalCount: responseData.totalCount || 0 };
        },
        [
            pagination.pageNumber,
            pagination.pageCount,
            queryParams?.companyName,
            queryParams?.requisitionId,
            queryParams?.title,
            queryParams?.location,
            queryParams?.daysOld,
            queryParams?.jobScore,
        ]
    );

    const setPage = (pageNumber: number) => {
        setPagination(prev => ({ ...prev, pageNumber }));
    };

    const setPageCount = (pageCount: number) => {
        setPagination(prev => ({ ...prev, pageCount, pageNumber: 1 }));
    };

    return {
        jobPosts: data?.posts ?? [],
        totalCount: data?.totalCount ?? 0,
        loading,
        error,
        pagination,
        setPage,
        setPageCount,
        refresh: () => setPagination(prev => ({ ...prev })),
    };
}
