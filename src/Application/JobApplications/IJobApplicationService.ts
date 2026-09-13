import { IJobApplication, JobApplicationStatus } from "../../Domain/JobApplications/IJobApplication";

export interface IJobApplicationService {
    UpdateStatus(id: string, status: JobApplicationStatus): Promise<void>;
    add(jobId: string): Promise<void>;
    getAll(): Promise<IJobApplication[]>;
    getByIdOrThrow(id: string): Promise<IJobApplication>;
    getByJobId(jobId: string): Promise<IJobApplication | undefined>;
}
