// types/IJobSearchResult.ts

export interface IJobSearchResult {
    // /**
    //  * Stable application-owned identifier for this job posting.
    //  *
    //  * Remains the same as the posting moves through screening,
    //  * detail retrieval, scoring, shortlisting, and application tracking.
    //  */
    // jobPostingId: string;

    /**
     * Stable identifier supplied by the external job source.
     *
     * Examples:
     * "JR-0109507"
     * "R-51887"
     */
    jobSourceId: string;

    /**
     * Human-readable job title.
     */
    title: string;

    /**
     * Employer name.
     */
    company: string;

    /**
     * Path of the actual job detail page.
     *
     * This will normally be what getDetail() uses.
     */
    detailPath: string;

    /**
     * Optional employer requisition ID when distinct from sourceJobId.
     */
    requisitionId?: string;

    /**
     * Lightweight location information from search results.
     */
    locations?: string[];

    /**
     * Date from the search result if available.
     */
    postedDate?: string;
}
