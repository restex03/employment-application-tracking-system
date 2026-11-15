import { IJobPostDetail } from "./IJobPostDetail";

export interface IJobPost {
    id: string;
    sourceId: string;
    companyName: string;
    requisitionId?: string;
    title: string;
    detailPath: string;
    jobLink: string;
    locations: string[];
    postedDate?: string | null;
    importedDate: Date;
    detail: IJobPostDetail;
    remoteType?: string;
}
