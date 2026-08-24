export type TravelersJobsResponse = {
  total: number;
  jobPostings: TravelersWorkdayJobPosting[];
  facets: TravelersWorkdayFacet[];
  userAuthenticated: boolean;
};

export type TravelersWorkdayJobPosting = {
  title: string;
  externalPath: string;
  locationsText: string;
  postedOn: string;
  remoteType: string;
  bulletFields: string[];
};

export type TravelersWorkdayFacet = {
  facetParameter: string;
  descriptor?: string;
  values: Array<TravelersWorkdayFacet | TravelersWorkdayFacetValue>;
};

export type TravelersWorkdayFacetValue = {
  descriptor: string;
  id: string;
  count: number;
};