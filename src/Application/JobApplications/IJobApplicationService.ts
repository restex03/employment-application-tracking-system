import {
    IJobApplication,
    IJobApplicationAttachment,
    JobApplicationStatus,
} from "../../Domain/JobApplications/IJobApplication";

export interface IJobApplicationService {
    UpdateStatus(id: string, status: JobApplicationStatus, notes: string): Promise<void>;
    add(jobId: string): Promise<void>;
    getAll(): Promise<IJobApplication[]>;
    getByIdOrThrow(id: string): Promise<IJobApplication>;
    getByJobId(jobId: string): Promise<IJobApplication | undefined>;
    addAttachment(applicationId: string, fileName: string, content: Buffer): Promise<IJobApplicationAttachment>;
    getAttachment(applicationId: string, attachmentId: string): Promise<{ fileName: string; content: Buffer }>;
}
