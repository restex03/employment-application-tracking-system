export type WorkdayJobsResponse = {
  total: number;
  jobPostings: WorkdayJobPosting[];
  facets: WorkdayFacet[];
  userAuthenticated: boolean;
};

export type WorkdayJobPosting = {
  title: string;
  externalPath: string;
  locationsText: string;
  postedOn: string;
  remoteType: string;
  bulletFields: string[];
};

export type WorkdayFacet = {
  facetParameter: string;
  descriptor?: string;
  values: Array<WorkdayFacet | WorkdayFacetValue>;
};

export type WorkdayFacetValue = {
  descriptor: string;
  id: string;
  count: number;
};