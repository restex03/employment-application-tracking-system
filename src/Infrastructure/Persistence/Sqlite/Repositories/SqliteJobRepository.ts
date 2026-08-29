import Database from "better-sqlite3";

import { IJobSearchResult } from "../../../APIs/JobSources/IJobSearchResult";
import { IJobRepository } from "../../IJobRepository";

interface JobInsertParameters {
    source: string;
    sourceJobId: string;
    requisitionId: string | null;
    company: string;
    title: string;
    detailPath: string;
    locations: string | null;
    postedDate: string | null;
}

export class SqliteJobRepository implements IJobRepository {
    private readonly existsStatement: Database.Statement;
    private readonly insertStatement: Database.Statement;

    constructor(private readonly connection: Database.Database) {
        this.existsStatement = this.connection.prepare(`
            SELECT 1
            FROM jobs
            WHERE source = ?
              AND source_job_id = ?
            LIMIT 1
        `);

        this.insertStatement = this.connection.prepare(`
            INSERT INTO jobs (
                source,
                source_job_id,
                requisition_id,
                company,
                title,
                detail_path,
                locations,
                posted_date
            )
            VALUES (
                @source,
                @sourceJobId,
                @requisitionId,
                @company,
                @title,
                @detailPath,
                @locations,
                @postedDate
            )
            ON CONFLICT(source, source_job_id)
            DO NOTHING
        `);
    }

    public async exists(source: string, sourceJobId: string): Promise<boolean> {
        const row = this.existsStatement.get(source, sourceJobId);

        return row !== undefined;
    }

    public async add(source: string, job: IJobSearchResult): Promise<void> {
        this.insertStatement.run(this.mapInsertParameters(source, job));
    }

    public async addMany(source: string, jobs: IJobSearchResult[]): Promise<void> {
        const insertMany = this.connection.transaction((jobs: IJobSearchResult[]) => {
            for (const job of jobs) {
                this.insertStatement.run(this.mapInsertParameters(source, job));
            }
        });

        insertMany(jobs);
    }

    private mapInsertParameters(source: string, job: IJobSearchResult): JobInsertParameters {
        return {
            source,
            sourceJobId: job.id,
            requisitionId: job.requisitionId ?? null,
            company: job.company,
            title: job.title,
            detailPath: job.detailPath,
            locations: job.locations ? JSON.stringify(job.locations) : null,
            postedDate: job.postedDate ?? null,
        };
    }
}
