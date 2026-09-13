export interface IJobApplication {
    id: string;
    jobId: string;
    status: JobApplicationStatus;
    createdAt: string;
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
