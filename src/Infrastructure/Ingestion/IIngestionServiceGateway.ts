import { IJobPostSyncTask, IJobPostSyncTaskRequest } from "../../Application/JobPostSync/Queue/IJobPostSyncJob";
import { ILogger } from "../Logging/ILogger";

export interface IIngestionServiceGateway {
    getQueueTaskById(jobId: string): Promise<IJobPostSyncTask>;
    getActiveSyncTasks(): Promise<IJobPostSyncTask[]>;
    initiateJobPostSyncTask(job: IJobPostSyncTaskRequest): Promise<string>;
}


export class IngestionServiceGateway implements IIngestionServiceGateway {
    constructor(
        private readonly ingestionServiceBaseUrl: string,
        private readonly logger: ILogger
    ) {}

    public async getQueueTaskById(taskId: string): Promise<IJobPostSyncTask> {
        const path = `/ingestion/queueTasks/${taskId}`;
        return this.requestJson(path, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        }, `Failed to fetch ingestion queue task ${taskId}`);
    }

    public async getActiveSyncTasks(): Promise<IJobPostSyncTask[]> {
        const path = `/ingestion/queueTasks?active=true`;
        return this.requestJson(path, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        }, "Failed to fetch active ingestion queue tasks");
    }

    public async initiateJobPostSyncTask(taskRequest: { sourceIds: string[]; searchText: string; }): Promise<string> {
        const path = `/ingestion/queueTasks/sync`;
        const data = await this.requestJson<{ id: string }>(path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskRequest)
        }, "Failed to initiate ingestion job-post sync");
        return data.id;
    }

    private async requestJson<T>(
        path: string,
        init: RequestInit,
        operation: string
    ): Promise<T> {
        const url = new URL(path, this.ingestionServiceBaseUrl);
        const response = await fetch(url.toString(), init);
        const body = await response.text();

        if (response.status < 200 || response.status >= 300) {
            const errorMessage = `${operation}: HTTP ${response.status} ${response.statusText}. ${body}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        if (body.trim().length === 0) {
            const errorMessage = `${operation}: response body is undefined`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        let data: T | undefined;
        try {
            data = JSON.parse(body) as T | undefined;
        } catch (error) {
            const detail = error instanceof Error ? `: ${error.message}` : "";
            const errorMessage = `${operation}: failed to parse response body as JSON${detail}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        if (data === undefined) {
            const errorMessage = `${operation}: response body is undefined`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        return data;
    }
}