export interface IWorkdayJobsResponse {
    total: number;

    jobPostings: Array<{
        title: string;
        externalPath: string;
        locationsText: string;
        postedOn: string;
        remoteType?: string;
        bulletFields: string[];
    }>;

    facets: Array<{
        facetParameter: string;
        descriptor?: string;

        values: Array<
            | IWorkdayJobsResponse["facets"][number]
            | {
                  descriptor: string;
                  id: string;
                  count: number;
              }
        >;
    }>;

    userAuthenticated: boolean;
}
