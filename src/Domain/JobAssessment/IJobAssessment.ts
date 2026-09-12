import { IJobMatchScore } from "./Scoring/IJobMatchScore";
import { IJobRequirementMatch } from "../../Application/JobAssessment/RequirementMatching/IJobRequirementMatch";
import { IClassifiedJobRequirement } from "../../Application/JobAssessment/RquirementClassification/IClassifiedJobRequirement";
import { IJobScreenResult } from "../../Application/JobAssessment/Screening/IJobScreenResult";

export type JobAssessmentReviewStatus = "unreviewed" | "accepted" | "flagged";

export type JobAssessmentStatus = "complete" | "incomplete" | "unknown";

export interface IJobAssessment {
    readonly id: string;
    readonly candidateProfileId: string;
    readonly jobPostId: string;
    readonly createdAt: Date;

    readonly status: JobAssessmentStatus;
    readonly reviewStatus: JobAssessmentReviewStatus;

    readonly screenResult?: IJobScreenResult;
    readonly requirements: readonly IClassifiedJobRequirement[];
    readonly requirementMatches: readonly IJobRequirementMatch[];
    readonly jobMatchScore?: IJobMatchScore;

    setScreenResult(screenResult: IJobScreenResult): void;

    setRequirements(requirements: IClassifiedJobRequirement[]): void;

    setRequirementMatches(matches: IJobRequirementMatch[]): void;

    setJobMatchScore(score: IJobMatchScore): void;

    markComplete(): void;

    acceptReview(): void;

    flagReview(): void;

    resetReview(): void;
}

export interface JobAssessmentProps {
    id: string;
    candidateProfileId: string;
    jobPostId: string;

    status?: JobAssessmentStatus;
    reviewStatus?: JobAssessmentReviewStatus;

    screenResult?: IJobScreenResult;
    requirements?: IClassifiedJobRequirement[];
    requirementMatches?: IJobRequirementMatch[];
    jobMatchScore?: IJobMatchScore;

    createdAt: Date;
}

export class JobAssessment implements IJobAssessment {
    public readonly id: string;
    public readonly candidateProfileId: string;
    public readonly jobPostId: string;
    public readonly createdAt: Date;

    private _status: JobAssessmentStatus;
    private _reviewStatus: JobAssessmentReviewStatus;

    private _screenResult?: IJobScreenResult;
    private _requirements: IClassifiedJobRequirement[];
    private _requirementMatches: IJobRequirementMatch[];
    private _jobMatchScore?: IJobMatchScore;

    constructor(props: JobAssessmentProps) {
        this.id = props.id;
        this.candidateProfileId = props.candidateProfileId;
        this.jobPostId = props.jobPostId;
        this.createdAt = props.createdAt;

        this._status = props.status ?? "incomplete";
        this._reviewStatus = props.reviewStatus ?? "unreviewed";

        this._screenResult = props.screenResult;
        this._requirements = props.requirements ?? [];
        this._requirementMatches = props.requirementMatches ?? [];
        this._jobMatchScore = props.jobMatchScore;
    }

    public get status(): JobAssessmentStatus {
        return this._status;
    }

    public get reviewStatus(): JobAssessmentReviewStatus {
        return this._reviewStatus;
    }

    public get screenResult(): IJobScreenResult | undefined {
        return this._screenResult;
    }

    public get requirements(): readonly IClassifiedJobRequirement[] {
        return this._requirements;
    }

    public get requirementMatches(): readonly IJobRequirementMatch[] {
        return this._requirementMatches;
    }

    public get jobMatchScore(): IJobMatchScore | undefined {
        return this._jobMatchScore;
    }

    public setScreenResult(screenResult: IJobScreenResult): void {
        this._screenResult = screenResult;
    }

    public setRequirements(requirements: IClassifiedJobRequirement[]): void {
        this._requirements = [...requirements];
    }

    public setRequirementMatches(matches: IJobRequirementMatch[]): void {
        this._requirementMatches = [...matches];
    }

    public setJobMatchScore(score: IJobMatchScore): void {
        this._jobMatchScore = score;
    }

    public markComplete(): void {
        this._status = "complete";
    }

    public acceptReview(): void {
        this._reviewStatus = "accepted";
    }

    public flagReview(): void {
        this._reviewStatus = "flagged";
    }

    public resetReview(): void {
        this._reviewStatus = "unreviewed";
    }
}
