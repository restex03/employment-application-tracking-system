import { IJobSource } from "../../Domain/JobSources/IJobSource";
import { ILogger } from "../Logging/ILogger";

export interface IJobSourceGateway {
    getByIdOrThrow(sourceId: string): Promise<IJobSource | undefined>;
    getAll(): Promise<IJobSource[]>;
    getAllByCompanyName(companyName: string): Promise<IJobSource | undefined>;

}

export class JobSourceGateway implements IJobSourceGateway {

    constructor(private readonly baseUrl: string, private readonly logger: ILogger) {}
    
    public async getByIdOrThrow(sourceId: string): Promise<IJobSource | undefined> {
        
        const url = new URL(`/jobSources/${sourceId}`, this.baseUrl);
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errMsg = `Failed to fetch job source by ID: ${errorText}`
            this.logger.error(errMsg);
            throw new Error(errMsg);
        }
        return await response.json();
    }

    public async getAll(): Promise<IJobSource[]> {
        const url = new URL("/api/ingestion/jobSources", this.baseUrl);
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errMsg = `Failed to fetch job sources: ${errorText}`
            this.logger.error(errMsg);
            throw new Error(errMsg);
        }
        return await response.json();
    }

    public async getAllByCompanyName(companyName: string): Promise<IJobSource | undefined> {
        const url = new URL(`/api/ingestion/jobSources?companyName=${encodeURIComponent(companyName)}`, this.baseUrl);
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            const errMsg = `Failed to fetch job sources: ${errorText}`
            this.logger.error(errMsg);
            throw new Error(errMsg);
        }
        return await response.json();
    }
}