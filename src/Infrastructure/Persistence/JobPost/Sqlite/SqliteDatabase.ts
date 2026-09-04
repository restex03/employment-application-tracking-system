import Database from "better-sqlite3";

export class SqliteDatabase {
    public readonly connection: Database.Database;

    constructor(databasePath: string) {
        this.connection = new Database(databasePath);

        this.connection.pragma("journal_mode = WAL");
        this.connection.pragma("foreign_keys = ON");

        this.initialize();
    }

    public close(): void {
        this.connection.close();
    }

    private initialize(): void {
        this.createSchema();
    }

    private createSchema(): void {
        this.connection.exec(`
            CREATE TABLE IF NOT EXISTS workday_job_sources (
                id TEXT PRIMARY KEY NOT NULL,
                company_name TEXT NOT NULL,
                base_url TEXT NOT NULL UNIQUE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_workday_job_sources_company_name
            ON workday_job_sources(company_name);

            CREATE TABLE IF NOT EXISTS job_posts (
                id TEXT PRIMARY KEY NOT NULL,
                source_id TEXT NOT NULL,
                requisition_id TEXT,
                title TEXT NOT NULL,
                detail_path TEXT NOT NULL,
                locations TEXT,
                posted_date TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (source_id)
                    REFERENCES workday_job_sources(id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_job_posts_source_detail_path
            ON job_posts(source_id, detail_path);

            CREATE TABLE IF NOT EXISTS job_post_details (
                id TEXT PRIMARY KEY NOT NULL,
                job_post_id TEXT NOT NULL UNIQUE,

                description TEXT NOT NULL,
                employment_type TEXT,
                locations TEXT,
                valid_through TEXT,
                remote_type TEXT,
                applicant_locations TEXT,

                fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (job_post_id)
                    REFERENCES job_posts(id)
                    ON DELETE CASCADE
            );
        `);
    }
}
