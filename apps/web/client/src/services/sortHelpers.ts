/**
 * Generic sort utilities with no React or app dependencies.
 * Shared by tables that implement click-to-sort column headers.
 */

export type SortDirection = "asc" | "desc" | null;

/** Cycles: null -> asc -> desc -> null (no column set yet starts at asc). */
export function cycleSortDirection(current: SortDirection): SortDirection {
    if (current === null) return "asc";
    if (current === "asc") return "desc";
    return null;
}

/** Returns the indicator glyph for the active sort column, or null. */
export function getSortIndicator(activeColumn: string, sortColumn: string | null, sortDirection: SortDirection): string | null {
    if (sortColumn !== activeColumn || sortDirection === null) return null;
    return sortDirection === "asc" ? " \u2191" : " \u2193";
}

/**
 * Returns -1, 0, or 1 for a numeric comparison in the given direction.
 * `null` direction means no sorting (returns 0).
 */
export function compareNumeric(a: number, b: number, direction: SortDirection): number {
    if (direction === null) return 0;
    return direction === "asc" ? a - b : b - a;
}

/**
 * Returns -1, 0, or 1 for a string comparison (case-insensitive) in the given direction.
 * `null` direction means no sorting (returns 0).
 */
export function compareStrings(a: string, b: string, direction: SortDirection): number {
    if (direction === null) return 0;
    const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
    return direction === "asc" ? cmp : -cmp;
}

/** Compares ISO timestamps, keeping unknown dates last in either direction. */
export function compareDates(a: string | null | undefined, b: string | null | undefined, direction: SortDirection): number {
    if (direction === null) return 0;
    const aTime = a ? Date.parse(a) : NaN;
    const bTime = b ? Date.parse(b) : NaN;
    if (Number.isNaN(aTime)) return Number.isNaN(bTime) ? 0 : 1;
    if (Number.isNaN(bTime)) return -1;
    return compareNumeric(aTime, bTime, direction);
}
