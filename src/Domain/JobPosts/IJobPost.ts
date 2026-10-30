import { IJobPostDetail } from "./IJobPostDetail";

export interface IJobPost {
    id: string;
    sourceId: string;
    requisitionId?: string;
    title: string;
    detailPath: string;
    jobLink: string;
    locations?: unknown[];
    postedDate?: string | null;
    createdAt: Date;
    detail: IJobPostDetail;
    remoteType?: string;

    hydrateDetail(detail: IJobPostDetail): void;
}
