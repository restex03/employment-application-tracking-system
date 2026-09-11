import { IJobSource } from "../../Domain/JobSources/IJobSource";

export interface IJobSourceService {
    seedDefaultWorkdayJobSources(): Promise<void>;
    getJobSources(): Promise<IJobSource[]>;
}
