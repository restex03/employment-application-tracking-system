export interface IJobsRequest {
  appliedFacets: Record<string, string[]>;
  limit: number;
  offset: number;
  searchText: string;
};