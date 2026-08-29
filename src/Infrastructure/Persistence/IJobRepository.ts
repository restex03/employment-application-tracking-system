import { IJobSearchResult } from "../APIs/JobSources/IJobSearchResult";

export interface IJobRepository {
    exists(source: string, sourceJobId: string): Promise<boolean>;

    add(source: string, job: IJobSearchResult): Promise<void>;

    addMany(source: string, jobs: IJobSearchResult[]): Promise<void>;
}
