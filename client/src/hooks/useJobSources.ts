import { useEffect, useState } from 'react';
import { IJobSource } from '../types/JobPost';

export function useJobSources() {
    const [jobSources, setJobSources] = useState<IJobSource[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobSources = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('/api/v1/job-sources');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setJobSources(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch job sources');
                setJobSources([]);
            } finally {
                setLoading(false);
            }
        };

        fetchJobSources();
    }, []);

    // Create a lookup map for quick access
    const getCompanyName = (sourceId: string): string => {
        const source = jobSources.find(s => s.id === sourceId);
        return source ? source.companyName : 'Unknown';
    };

    return { jobSources, loading, error, getCompanyName };
}
