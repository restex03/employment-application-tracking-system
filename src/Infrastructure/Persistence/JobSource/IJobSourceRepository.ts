import { IWorkdayJobSource } from "../../JobSources/Workday/IWorkdayJobSource";

export type JobSourceInput = Omit<IWorkdayJobSource, "id">;

export interface IJobSourceRepository {
    upsert(source: JobSourceInput): Promise<IWorkdayJobSource>;

    upsertMany(sources: JobSourceInput[]): Promise<IWorkdayJobSource[]>;

    getById(id: string): Promise<IWorkdayJobSource | undefined>;
    getByIdOrThrow(id: string): Promise<IWorkdayJobSource>;

    getByCompanyName(companyName: string): Promise<IWorkdayJobSource | undefined>;

    getAll(): Promise<IWorkdayJobSource[]>;
}
