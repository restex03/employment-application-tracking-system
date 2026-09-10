export class WorkdayDaysOldNormalizer {
    public normalize(postedOn: string): string {
        if (postedOn === "Posted Today") {
            return "00";
        }
        if (postedOn === "Posted Yesterday") {
            return "01";
        }

        const match = postedOn.match(/^Posted (\d+) Days Ago$/);
        if (match) {
            return match[1].length > 1 ? match[1] : `0${match[1]}`;
        }

        // For "30+ Days Ago", return "30+"
        if (postedOn.includes("30+ Days Ago")) {
            return "30+";
        }

        return postedOn;
    }
}
