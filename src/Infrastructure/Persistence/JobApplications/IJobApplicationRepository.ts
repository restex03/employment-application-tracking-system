import {
    ICreateJobApplication,
    IJobApplication,
    JobApplicationStatus,
} from "../../../Domain/JobApplications/IJobApplication";

export interface IJobApplicationRepository {
    UpdateStatus(id: string, status: JobApplicationStatus): Promise<void>;
    add(application: ICreateJobApplication): Promise<void>;
    getAll(): Promise<IJobApplication[]>;
    getByIdOrThrow(id: string): Promise<IJobApplication>;
    getByJobId(jobId: string): Promise<IJobApplication | null>;
}
