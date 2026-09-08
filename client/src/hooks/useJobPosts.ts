import { useEffect, useState } from 'react';
import { IJobPost, IJobPostsResponse, PaginationParams } from '../types/JobPost';

export function useJobPosts(initialParams?: PaginationParams) {
    const [jobPosts, setJobPosts] = useState<IJobPost[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationParams>(initialParams || {
        pageNumber: 1,
        pageCount: 10,
    });

    useEffect(() => {
        const fetchJobPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const url = new URL('/api/v1/job-posts', window.location.origin);
                url.searchParams.append('pageNumber', pagination.pageNumber.toString());
                url.searchParams.append('pageCount', pagination.pageCount.toString());
                
                const response = await fetch(url.toString());
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data: IJobPostsResponse = await response.json();
                
                // Ensure createdAt is a string for display
                const posts = data.data.map((post: IJobPost) => ({
                    ...post,
                    createdAt: typeof post.createdAt === 'string' ? post.createdAt : new Date(post.createdAt).toISOString()
                }));
                
                setJobPosts(posts);
                setTotalCount(data.totalCount || 0);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch job posts');
                setJobPosts([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchJobPosts();
    }, [pagination.pageNumber, pagination.pageCount]);

    const setPage = (pageNumber: number) => {
        setPagination(prev => ({ ...prev, pageNumber }));
    };

    const setPageCount = (pageCount: number) => {
        setPagination(prev => ({ ...prev, pageCount, pageNumber: 1 }));
    };

    return { 
        jobPosts, 
        totalCount, 
        loading, 
        error, 
        pagination,
        setPage,
        setPageCount,
        refresh: () => setPagination(prev => ({ ...prev }))
    };
}
