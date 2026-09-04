export interface IJobPostDiscovery {
    /**
     * Job Source stable identifier affiliated with the job posting board
     * Guid
     */
    sourceId: string;

    /**
     * Human-readable job title.
     */
    title: string;

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
