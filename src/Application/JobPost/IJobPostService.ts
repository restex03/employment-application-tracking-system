export interface IJobPostService {
    setDismissed(id: string, dismissed: boolean): Promise<void>;
}
