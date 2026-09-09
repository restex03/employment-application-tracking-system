import { IJobPostDetail } from "./IJobPostDetail";

export interface IJobPost {
    id: string;
    sourceId: string;
    requisitionId?: string;
    title: string;
    detailPath: string;
    locations?: unknown[];
    postedDaysAgo?: string;
    createdAt: Date;
    detail?: IJobPostDetail;

    hydrateDetail(detail: IJobPostDetail): void;
}

export interface JobPostProps {
    id: string;
    sourceId: string;
    requisitionId?: string;
    title: string;
    detailPath: string;
    locations?: unknown[];
    postedDaysAgo?: string;
    createdAt: Date;
    detail?: IJobPostDetail;
}

export class JobPost implements IJobPost {
    public readonly id: string;
    public readonly sourceId: string;
    public readonly requisitionId?: string;
    public readonly title: string;
    public readonly detailPath: string;
    public readonly locations?: unknown[];
    public readonly postedDaysAgo?: string;
    public readonly createdAt: Date;
    public detail?: IJobPostDetail;

    constructor(props: JobPostProps) {
        this.id = props.id;
        this.sourceId = props.sourceId;
        this.requisitionId = props.requisitionId;
        this.title = props.title;
        this.detailPath = props.detailPath;
        this.locations = props.locations;
        this.postedDaysAgo = props.postedDaysAgo;
        this.createdAt = props.createdAt;
        this.detail = props.detail;
    }

    public hydrateDetail(detail: IJobPostDetail): void {
        this.detail = detail;
    }
}
