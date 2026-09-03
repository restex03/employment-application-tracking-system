import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IJobPostLookup } from "../../../../Domain/JobPosts/IJobPostLookup";
import { IJobRepository } from "../../IJobRepository";
import { ILogger } from "../../../Logging/ILogger";
import { IJobPostDetail } from "../../../../Domain/JobPosts/IJobPostDetail";

interface JobInsertParameters {
    id: string;
    sourceId: string;
    sourceJobId: string;
    requisitionId: string | null;
    company: string;
    title: string;
    detailPath: string;
    locations: string | null;
    postedDate: string | null;
}

export class SqliteJobRepository implements IJobRepository {
    private readonly insertLookupStatement: Database.Statement;

    constructor(
        private readonly connection: Database.Database,
        private readonly logger: ILogger
    ) {
        this.insertLookupStatement = this.connection.prepare(`
            INSERT INTO jobLookups (
                id,
                sourceId,
                source_job_id,
                requisition_id,
                company,
                title,
                detail_path,
                locations,
                posted_date
            )
            VALUES (
                @id,
                @sourceId,
                @sourceJobId,
                @requisitionId,
                @company,
                @title,
                @detailPath,
                @locations,
                @postedDate
            )
            ON CONFLICT(sourceId, detail_path)
            DO UPDATE SET
                locations = excluded.locations,
                posted_date = excluded.posted_date
        `);
    }
    addDetailsIfNotExists(source: string, jobs: IJobPostDetail[]): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async getJobPostCount(): Promise<number> {
        const row = this.connection.prepare(`SELECT COUNT(*) AS count FROM jobLookups`).get() as { count: number };

        return row.count;
    }

    public async add(source: string, job: IJobPostLookup): Promise<void> {
        this.insertLookupStatement.run(this.mapInsertParameters(source, job));
    }

    public async addLookupsIfNotExists(source: string, jobs: IJobPostLookup[]): Promise<void> {
        const insertMany = this.connection.transaction((jobs: IJobPostLookup[]) => {
            let inserted = 0;
            let skipped = 0;

            for (const job of jobs) {
                const result = this.insertLookupStatement.run(this.mapInsertParameters(source, job));

                if (result.changes === 1) {
                    inserted++;
                } else {
                    skipped++;
                }
            }

            return { inserted, skipped };
        });

        const result = insertMany(jobs);

        this.logger.debug(
            `[SqliteJobRepository.addManyIfNotExists] ` + `Inserted: ${result.inserted}, skipped: ${result.skipped}`
        );
    }

    private mapInsertParameters(sourceId: string, job: IJobPostLookup): JobInsertParameters {
        return {
            id: randomUUID(),
            sourceId,
            sourceJobId: job.jobSourceId,
            requisitionId: job.requisitionId ?? null,
            company: job.company,
            title: job.title,
            detailPath: job.detailPath,
            locations: job.locations ? JSON.stringify(job.locations) : null,
            postedDate: job.postedDate ?? null,
        };
    }
}
