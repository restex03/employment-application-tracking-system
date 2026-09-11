import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IJobSource } from "../../../../Domain/JobSources/IJobSource";

import { ILogger } from "../../../Logging/ILogger";
import { IJobSourceRepository, JobSourceInput } from "../IJobSourceRepository";

interface JobSourceParameters {
    id: string;
    companyName: string;
    baseUrl: string;
    browserBaseUrl: string;
}

interface JobSourceRow {
    id: string;
    company_name: string;
    base_url: string;
    browser_base_url: string;
}

export class SqliteJobSourceRepository implements IJobSourceRepository {
    private readonly upsertStatement: Database.Statement;
    private readonly getByIdStatement: Database.Statement;
    private readonly getByCompanyNameStatement: Database.Statement;
    private readonly getAllStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.upsertStatement = this.connection.prepare(`
            INSERT INTO job_sources (
                id,
                company_name,
                base_url,
                browser_base_url
            )
            VALUES (
                @id,
                @companyName,
                @baseUrl,
                @browserBaseUrl
            )
            ON CONFLICT(base_url)
            DO UPDATE SET
                company_name = excluded.company_name,
                browser_base_url = excluded.browser_base_url
            RETURNING
                id,
                company_name,
                base_url,
                browser_base_url
        `);

        this.getByIdStatement = this.connection.prepare(`
            SELECT
                id,
                company_name,
                base_url,
                browser_base_url
            FROM job_sources
            WHERE id = ?
            LIMIT 1
        `);

        this.getByCompanyNameStatement = this.connection.prepare(`
            SELECT
                id,
                company_name,
                base_url,
                browser_base_url
            FROM job_sources
            WHERE company_name = ?
            LIMIT 1
        `);

        this.getAllStatement = this.connection.prepare(`
            SELECT
                id,
                company_name,
                base_url,
                browser_base_url
            FROM job_sources
            ORDER BY company_name
        `);
    }

    public async upsert(source: JobSourceInput): Promise<IJobSource> {
        const row = this.upsertStatement.get(this.mapParameters(source)) as JobSourceRow;

        const result = this.mapRow(row);

        this.logger.debug(`[JobSourceRepository.upsert] ` + `Upserted source: ${result.companyName} (${result.id})`);

        return result;
    }

    public async upsertMany(sources: JobSourceInput[]): Promise<IJobSource[]> {
        const upsertMany = this.connection.transaction((sources: JobSourceInput[]) => {
            const results: IJobSource[] = [];

            for (const source of sources) {
                const row = this.upsertStatement.get(this.mapParameters(source)) as JobSourceRow;

                results.push(this.mapRow(row));
            }

            return results;
        });

        const results = upsertMany(sources);

        this.logger.debug(`[JobSourceRepository.upsertMany] ` + `Processed ${results.length} job sources`);

        return results;
    }

    public async getById(id: string): Promise<IJobSource | undefined> {
        const row = this.getByIdStatement.get(id) as JobSourceRow | undefined;

        if (!row) {
            this.logger.debug(`[JobSourceRepository.getById] ` + `No job source found for id: ${id}`);

            return undefined;
        }

        const result = this.mapRow(row);

        this.logger.debug(`[JobSourceRepository.getById] ` + `Found source: ${result.companyName} (${result.id})`);

        return result;
    }
    public async getByIdOrThrow(id: string): Promise<IJobSource> {
        const source = await this.getById(id);
        if (!source) {
            throw new Error(`Job source not found for id: ${id}`);
        }
        return source;
    }

    public async getByCompanyName(companyName: string): Promise<IJobSource | undefined> {
        const row = this.getByCompanyNameStatement.get(companyName) as JobSourceRow | undefined;

        if (!row) {
            this.logger.debug(
                `[JobSourceRepository.getByCompanyName] ` + `No job source found for company: ${companyName}`
            );

            return undefined;
        }

        const result = this.mapRow(row);

        this.logger.debug(
            `[JobSourceRepository.getByCompanyName] ` + `Found source: ${result.companyName} (${result.id})`
        );

        return result;
    }

    public async getAll(): Promise<IJobSource[]> {
        const rows = this.getAllStatement.all() as JobSourceRow[];

        const results = rows.map(row => this.mapRow(row));

        this.logger.debug(`[JobSourceRepository.getAll] ` + `Retrieved ${results.length} job sources`);

        return results;
    }

    private mapParameters(source: JobSourceInput): JobSourceParameters {
        return {
            id: randomUUID(),
            companyName: source.companyName,
            baseUrl: source.baseUrl,
            browserBaseUrl: source.browserBaseUrl,
        };
    }

    private mapRow(row: JobSourceRow): IJobSource {
        return {
            id: row.id,
            companyName: row.company_name,
            baseUrl: row.base_url,
            browserBaseUrl: row.browser_base_url,
        };
    }
}
