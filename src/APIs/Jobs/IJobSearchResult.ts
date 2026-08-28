// types/IJobSearchResult.ts

export interface IJobSearchResult {
    /**
     * Stable identifier from the source when available.
     *
     * Examples:
     * "JR-0109507"
     * "R-51887"
     */
    id: string;

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
     * Optional requisition ID when distinct from id.
     */
    requisitionId?: string;

    /**
     * Lightweight location information from search results.
     *
     * Don't require this because some search APIs return poor
     * location metadata until the detail request.
     */
    locations?: string[];

    /**
     * Date from the search result if available.
     */
    postedDate?: string;
}
