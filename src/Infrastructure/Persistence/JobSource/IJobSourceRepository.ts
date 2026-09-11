import { IJobSource } from "../../../Domain/JobSources/IJobSource";

export type JobSourceInput = Omit<IJobSource, "id">;

export interface IJobSourceRepository {
    upsert(source: JobSourceInput): Promise<IJobSource>;

    upsertMany(sources: JobSourceInput[]): Promise<IJobSource[]>;

    getById(id: string): Promise<IJobSource | undefined>;
    getByIdOrThrow(id: string): Promise<IJobSource>;

    getByCompanyName(companyName: string): Promise<IJobSource | undefined>;

    getAll(): Promise<IJobSource[]>;
}
