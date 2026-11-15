import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import { schema } from "./Drizzle/schema";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export class SqliteDatabaseProvider {
    public readonly client: Database.Database;
    public readonly database: AppDatabase;

    constructor(databasePath: string) {
        this.client = new Database(databasePath);
        this.client.pragma("journal_mode = WAL");
        this.client.pragma("foreign_keys = ON");

        this.database = drizzle(this.client, { schema, casing: "snake_case" });
        migrate(this.database, {
            migrationsFolder: fileURLToPath(new URL("./Drizzle/Migrations", import.meta.url)),
        });
    }

    public close(): void {
        this.client.close();
    }
}
