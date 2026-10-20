import { IJobPostSyncTask, IJobPostSyncTaskRequest } from "../../Application/JobPostSync/Queue/IJobPostSyncJob";

export interface IIngestionServiceGateway {
    initiateJobPostDetailSyncTask(sourceIds: string[]): Promise<string>;
    getSyncTaskById(jobId: string): Promise<IJobPostSyncTask>;
    getActiveSyncTasks(): Promise<IJobPostSyncTask[]>;
    initiateJobPostSyncTask(job: IJobPostSyncTaskRequest): Promise<string>;
}


export class IngestionServiceGateway implements IIngestionServiceGateway {
    private ingestionServiceBaseUrl: string;

    constructor(ingestionServiceBaseUrl: string) {
        this.ingestionServiceBaseUrl = ingestionServiceBaseUrl;
    }
    public async getSyncTaskById(jobId: string): Promise<IJobPostSyncTask> {
        throw new Error("Method not implemented.");
    }
    public async getActiveSyncTasks(): Promise<IJobPostSyncTask[]> {
        throw new Error("Method not implemented.");
    }
    public async initiateJobPostSyncTask(job: { sourceIds: string[]; searchText: string; }): Promise<string> {
        const path = `/ingestion/jobPosts/sync`;
        const response = await fetch(`${this.ingestionServiceBaseUrl}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(job)
        });
        const data = await response.json();
        return data.id;
    }

    public async initiateJobPostDetailSyncTask(sourceIds: string[]): Promise<string> {
        throw new Error("Method not implemented.");
    }

}