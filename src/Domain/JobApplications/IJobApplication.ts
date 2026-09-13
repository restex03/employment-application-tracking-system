export interface IJobApplicationAttachment {
    id: string;
    fileName: string;
}

export interface IJobApplication {
    id: string;
    jobId: string;
    status: JobApplicationStatus;
    createdAt: string;
    attachments: IJobApplicationAttachment[];
}

export enum JobApplicationStatus {
    Applied = "APPLIED",
    Interview = "INTERVIEW",
    Offer = "OFFER",
    Rejected = "REJECTED",
    Review = "REVIEW",
}

export interface ICreateJobApplication {
    id: string;
    jobId: string;
    status: JobApplicationStatus;
}
