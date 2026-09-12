import { useCallback, useEffect, useState } from "react";
import { ICandidateProfile } from "../types/CandidateProfile";

export function useCandidateProfiles() {
    const [candidateProfiles, setCandidateProfiles] = useState<ICandidateProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCandidateProfiles = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/v1/candidate-profiles", { signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: ICandidateProfile[] = await response.json();
            setCandidateProfiles(data);
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                return;
            }
            setError(err instanceof Error ? err.message : "Failed to load candidate profiles");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void fetchCandidateProfiles(controller.signal);
        return () => {
            controller.abort();
        };
    }, [fetchCandidateProfiles]);

    return {
        candidateProfiles,
        loading,
        error,
        refetch: fetchCandidateProfiles,
    };
}
