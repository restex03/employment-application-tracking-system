import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/IWorkdayJobSource";

export interface IJobSourceService {
    seedDefaultWorkdayJobSources(): Promise<void>;
    getJobSources(): Promise<IWorkdayJobSource[]>;
}
