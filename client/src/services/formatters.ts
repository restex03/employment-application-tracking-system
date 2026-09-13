/**
 * Pure formatting utilities with no React or DOM dependencies.
 * Shared across components to eliminate duplicate date/location/list formatters.
 */

export type DateFormat = "date" | "datetime" | "datetimeSeconds";

const FORMAT_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    date: { year: "numeric", month: "short", day: "numeric" },
    datetime: { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
    datetimeSeconds: {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    },
};

/**
 * Formats an ISO date string for display.
 * Returns `fallback` (default "N/A") when the input is empty or invalid.
 */
export function formatDate(
    value: string | undefined | null,
    format: DateFormat = "date",
    fallback = "N/A"
): string {
    if (!value) return fallback;
    try {
        return new Date(value).toLocaleString("en-US", FORMAT_OPTIONS[format]);
    } catch {
        return value;
    }
}

interface ILocationLike {
    city?: string;
    state?: string;
    country?: string;
}

/**
 * Extracts a readable location string (city, state, country) from a single location object or string.
 */
export function formatLocation(loc: unknown): string {
    if (typeof loc === "string") return loc;
    if (typeof loc === "object" && loc !== null) {
        const obj = loc as ILocationLike;
        const parts = [obj.city, obj.state, obj.country].filter(Boolean) as string[];
        return parts.length > 0 ? parts.join(", ") : "Unknown";
    }
    return String(loc);
}

/**
 * Formats an array of location objects into a single semicolon-delimited string.
 * Returns `fallback` (default "N/A") when the array is empty.
 */
export function formatLocations(locations: unknown[] | undefined, fallback = "N/A"): string {
    if (!locations || locations.length === 0) return fallback;
    return locations.map(formatLocation).join("; ");
}

/**
 * Joins an array of strings into a comma-delimited display.
 * When `maxItems` is set and the array exceeds it, appends "+N more".
 * Returns `fallback` (default "N/A") when the array is empty.
 */
export function formatList(
    values: string[] | undefined,
    maxItems?: number,
    fallback = "N/A"
): string {
    if (!values || values.length === 0) return fallback;
    if (maxItems === undefined) return values.join(", ");
    const shown = values.slice(0, maxItems).join(", ");
    return values.length > maxItems ? `${shown}, +${values.length - maxItems} more` : shown;
}
