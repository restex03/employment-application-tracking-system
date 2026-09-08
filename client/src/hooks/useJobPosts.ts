import { useEffect, useState } from 'react';
import { IJobPost } from '../types/JobPost';

export function useJobPosts() {
    const [jobPosts, setJobPosts] = useState<IJobPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('/api/v1/job-posts');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                // Ensure createdAt is a string for display
                const posts = data.map((post: IJobPost) => ({
                    ...post,
                    createdAt: typeof post.createdAt === 'string' ? post.createdAt : new Date(post.createdAt).toISOString()
                }));
                
                setJobPosts(posts);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch job posts');
                setJobPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchJobPosts();
    }, []);

    return { jobPosts, loading, error };
}
