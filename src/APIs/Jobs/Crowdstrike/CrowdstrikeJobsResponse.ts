// CrowdstrikeWorkdayJobsApiGateway.ts

export type CrowdstrikeJobsResponse = {
  total: number;
  jobPostings: JobPosting[];
  facets: Facet[];
  userAuthenticated: boolean;
};

export type JobPosting = {
  title: string;
  externalPath: string;
  locationsText: string;
  postedOn: string;
  bulletFields: string[];
};

export type Facet = {
  facetParameter: string;
  descriptor?: string;
  values: Array<Facet | FacetValue>;
};

export type FacetValue = {
  descriptor: string;
  id: string;
  count: number;
};