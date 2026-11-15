/** Uses calendar days rather than 24-hour durations to preserve local midnight across DST changes. */
export function postedDateSince(daysAgo: number, now = new Date()): string {
    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - daysAgo);
    return cutoff.toISOString();
}
