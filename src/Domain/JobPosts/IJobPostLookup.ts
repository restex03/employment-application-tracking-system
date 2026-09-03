// types/IJobPostLookup.ts

export interface IJobPostLookup {
    // /**
    //  * Stable application-owned identifier for this job posting.
    //  *
    //  * Remains the same as the posting moves through screening,
    //  * detail retrieval, scoring, shortlisting, and application tracking.
    //  */
    // jobPostingId: string;

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
     * Stable identifier supplied by the external job source.
     *
     * Examples:
     * "JR-0109507"
     * "R-51887"
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
