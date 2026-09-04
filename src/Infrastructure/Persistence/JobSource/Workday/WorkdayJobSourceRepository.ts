import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IWorkdayJobSource } from "../../../JobSources/Workday/IWorkdayJobSource";

import { ILogger } from "../../../Logging/ILogger";
import { IJobSourceRepository, JobSourceInput } from "../IJobSourceRepository";

interface WorkdaySourceParameters {
    id: string;
    companyName: string;
    baseUrl: string;
}

interface WorkdaySourceRow {
    id: string;
    company_name: string;
    base_url: string;
}

export class WorkdayJobSourceRepository implements IJobSourceRepository {
    private readonly upsertStatement: Database.Statement;
    private readonly getByIdStatement: Database.Statement;
    private readonly getByCompanyNameStatement: Database.Statement;
    private readonly getAllStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.upsertStatement = this.connection.prepare(`
            INSERT INTO workday_job_sources (
                id,
                company_name,
                base_url
            )
            VALUES (
                @id,
                @companyName,
                @baseUrl
            )
            ON CONFLICT(base_url)
            DO UPDATE SET
                company_name = excluded.company_name
            RETURNING
                id,
                company_name,
                base_url
        `);

        this.getByIdStatement = this.connection.prepare(`
            SELECT
                id,
                company_name,
                base_url
            FROM workday_job_sources
            WHERE id = ?
            LIMIT 1
        `);

        this.getByCompanyNameStatement = this.connection.prepare(`
            SELECT
                id,
                company_name,
                base_url
            FROM workday_job_sources
            WHERE company_name = ?
            LIMIT 1
        `);

        this.getAllStatement = this.connection.prepare(`
            SELECT
                id,
                company_name,
                base_url
            FROM workday_job_sources
            ORDER BY company_name
        `);
    }

    public async upsert(source: JobSourceInput): Promise<IWorkdayJobSource> {
        const row = this.upsertStatement.get(this.mapParameters(source)) as WorkdaySourceRow;

        const result = this.mapRow(row);

        this.logger.debug(
            `[WorkdayJobSourceRepository.upsert] ` + `Upserted source: ${result.companyName} (${result.id})`
        );

        return result;
    }

    public async upsertMany(sources: JobSourceInput[]): Promise<IWorkdayJobSource[]> {
        const upsertMany = this.connection.transaction((sources: JobSourceInput[]) => {
            const results: IWorkdayJobSource[] = [];

            for (const source of sources) {
                const row = this.upsertStatement.get(this.mapParameters(source)) as WorkdaySourceRow;

                results.push(this.mapRow(row));
            }

            return results;
        });

        const results = upsertMany(sources);

        this.logger.debug(
            `[WorkdayJobSourceRepository.upsertMany] ` + `Processed ${results.length} Workday job sources`
        );

        return results;
    }

    public async getById(id: string): Promise<IWorkdayJobSource | undefined> {
        const row = this.getByIdStatement.get(id) as WorkdaySourceRow | undefined;

        if (!row) {
            this.logger.debug(`[WorkdayJobSourceRepository.getById] ` + `No Workday job source found for id: ${id}`);

            return undefined;
        }

        const result = this.mapRow(row);

        this.logger.debug(
            `[WorkdayJobSourceRepository.getById] ` + `Found source: ${result.companyName} (${result.id})`
        );

        return result;
    }

    public async getByCompanyName(companyName: string): Promise<IWorkdayJobSource | undefined> {
        const row = this.getByCompanyNameStatement.get(companyName) as WorkdaySourceRow | undefined;

        if (!row) {
            this.logger.debug(
                `[WorkdayJobSourceRepository.getByCompanyName] ` +
                    `No Workday job source found for company: ${companyName}`
            );

            return undefined;
        }

        const result = this.mapRow(row);

        this.logger.debug(
            `[WorkdayJobSourceRepository.getByCompanyName] ` + `Found source: ${result.companyName} (${result.id})`
        );

        return result;
    }

    public async getAll(): Promise<IWorkdayJobSource[]> {
        const rows = this.getAllStatement.all() as WorkdaySourceRow[];

        const results = rows.map(row => this.mapRow(row));

        this.logger.debug(`[WorkdayJobSourceRepository.getAll] ` + `Retrieved ${results.length} Workday job sources`);

        return results;
    }

    private mapParameters(source: JobSourceInput): WorkdaySourceParameters {
        return {
            id: randomUUID(),
            companyName: source.companyName,
            baseUrl: source.baseUrl,
        };
    }

    private mapRow(row: WorkdaySourceRow): IWorkdayJobSource {
        return {
            id: row.id,
            companyName: row.company_name,
            baseUrl: row.base_url,
        };
    }
}
