export class WorkdayDaysOldNormalizer {
    public normalize(postedOn: string): number | undefined {
        if (postedOn === "Posted Today") {
            return 0;
        }
        if (postedOn === "Posted Yesterday") {
            return 1;
        }

        const match = postedOn.match(/^Posted (\d+) Days Ago$/);
        if (match) {
            return parseInt(match[1], 10);
        }

        // For "30+ Days Ago", normalize to 30
        if (postedOn.includes("30+ Days Ago")) {
            return 30;
        }

        return undefined;
    }
}
