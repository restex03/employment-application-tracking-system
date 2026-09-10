import { useEffect, useState } from "react";
import type { DependencyList } from "react";

export type AbortableRequest<T> = (signal: AbortSignal) => Promise<T>;

interface UseAbortableFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export function useAbortableFetch<T>(
    request: AbortableRequest<T>,
    dependencies: DependencyList,
    enabled = true
): UseAbortableFetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setData(null);
            setError(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const executeRequest = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await request(controller.signal);
                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }

                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Request failed");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        executeRequest();

        return () => {
            controller.abort();
        };
        // The caller controls when the request should rerun through dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, ...dependencies]);

    return { data, loading, error };
}
