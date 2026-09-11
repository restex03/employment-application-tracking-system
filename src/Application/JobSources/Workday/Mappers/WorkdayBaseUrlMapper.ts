export class WorkdayBaseUrlMapper {
    static deriveBrowserBaseUrl(baseUrl: string): string {
        return baseUrl.replace(/\/wday\/cxs\/[^/]+/, "/en-US");
    }
}
