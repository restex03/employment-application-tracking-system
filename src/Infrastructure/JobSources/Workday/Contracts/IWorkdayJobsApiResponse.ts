export interface IWorkdayJobsApiResponse {
    total: number;

    jobPostings: Array<{
        title: string;
        externalPath: string;
        locationsText?: string;
        postedOn?: string;
        bulletFields?: string[];
        remoteType?: string;
    }>;

    facets: Array<{
        facetParameter: string;
        descriptor?: string;

        values: Array<
            | IWorkdayJobsApiResponse["facets"][number]
            | {
                  descriptor: string;
                  id: string;
                  count: number;
              }
        >;
    }>;

    userAuthenticated: boolean;
}
