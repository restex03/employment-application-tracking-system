import { IJobSource } from "../types/JobPost";
import { useAbortableFetch } from "./useAbortableFetch";

export function useJobSources() {
    const { data, loading, error } = useAbortableFetch<IJobSource[]>(async signal => {
        const response = await fetch("/api/v1/job-sources", { signal });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }, []);

    const jobSources = data ?? [];

    // Create a lookup map for quick access
    const getCompanyName = (sourceId: string): string => {
        const source = jobSources.find(s => s.id === sourceId);
        return source ? source.companyName : "Unknown";
    };

    return { jobSources, loading, error, getCompanyName };
}
