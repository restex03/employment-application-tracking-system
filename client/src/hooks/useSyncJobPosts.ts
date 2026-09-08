import { useState } from 'react';

interface SyncResult {
    success: boolean;
    message?: string;
}

export function useSyncJobPosts() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const sync = async (sourceId?: string): Promise<SyncResult> => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            const response = await fetch('/api/v1/job-posts/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sourceId ? { sourceId } : {}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(message);
            }

            const result = await response.json();
            setSuccess(true);
            
            return {
                success: true,
                message: result.message || 'Job posts synced successfully',
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to sync job posts';
            setError(message);
            setSuccess(false);
            return {
                success: false,
                message,
            };
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setSuccess(false);
    };

    return { sync, loading, error, success, reset };
}
