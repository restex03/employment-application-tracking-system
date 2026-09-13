import {
    ICreateJobApplication,
    IJobApplication,
    IJobApplicationAttachment,
    JobApplicationStatus,
} from "../../../Domain/JobApplications/IJobApplication";

export interface IJobApplicationRepository {
    UpdateStatus(id: string, status: JobApplicationStatus, notes: string): Promise<void>;
    add(application: ICreateJobApplication): Promise<void>;
    getAll(): Promise<IJobApplication[]>;
    getByIdOrThrow(id: string): Promise<IJobApplication>;
    getByJobId(jobId: string): Promise<IJobApplication | null>;
    addAttachment(applicationId: string, attachment: IJobApplicationAttachment): Promise<IJobApplication>;
    updateAttachment(applicationId: string, attachment: IJobApplicationAttachment): Promise<IJobApplication>;
}
