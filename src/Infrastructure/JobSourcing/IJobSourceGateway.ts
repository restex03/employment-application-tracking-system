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
        const path = `${this.baseUrl}/jobSources/${sourceId}`;
        const response = await fetch(path, {
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
        const path = `${this.baseUrl}/jobSources`;
        const response = await fetch(path, {
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
        const path = `${this.baseUrl}/jobSources?companyName=${encodeURIComponent(companyName)}`;
        const response = await fetch(path, {
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