import Database from "better-sqlite3";

export class SqliteDatabase {
    public readonly connection: Database.Database;

    constructor(path: string) {
        this.connection = new Database(path);

        this.connection.pragma("journal_mode = WAL");
        this.connection.pragma("foreign_keys = ON");

        this.initialize();
    }

    private initialize(): void {
        this.connection.exec(`
            CREATE TABLE IF NOT EXISTS jobLookups (
                id TEXT PRIMARY KEY NOT NULL,
                sourceId TEXT NOT NULL,
                source_job_id TEXT NOT NULL,
                requisition_id TEXT,
                company TEXT NOT NULL,
                title TEXT NOT NULL,
                detail_path TEXT NOT NULL,
                locations TEXT,
                posted_date TEXT,
                first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_jobLookups_source_detail_path
            ON jobLookups(sourceId, detail_path);
        `);
    }
}
