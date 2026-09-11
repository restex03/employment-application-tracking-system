import { IJobPost } from "../../Domain/JobPosts/IJobPost";

export interface IJobPostSyncResult {
    sourcesProcessed: number;
    jobsDiscovered: number;
}

export interface IJobPostSyncService {
    syncJobDetails(jobPostId: string): Promise<void>;
    syncJobs(sourceIds: string[], searchText?: string): Promise<IJobPostSyncResult>;

    addMany(jobs: IJobPost[]): Promise<void>;
    update(job: IJobPost): Promise<void>;

    getByIdOrThrow(id: string): Promise<IJobPost>;
}
