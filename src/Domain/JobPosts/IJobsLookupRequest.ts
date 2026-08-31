export interface IJobsLookupRequest {
    appliedFacets: Record<string, string[]>;
    limit: number;
    offset: number;
    searchText: string;
}
