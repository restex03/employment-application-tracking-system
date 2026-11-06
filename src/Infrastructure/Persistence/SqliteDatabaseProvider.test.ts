import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SqliteDatabaseProvider } from "./SqliteDatabaseProvider";

describe("SqliteDatabaseProvider", () => {
    let directory: string;
    let databasePath: string;
    let provider: SqliteDatabaseProvider | undefined;

    beforeEach(() => {
        directory = mkdtempSync(path.join(tmpdir(), "eats-sqlite-migrations-"));
        databasePath = path.join(directory, "test.db");
    });

    afterEach(() => {
        provider?.close();
        provider = undefined;
        rmSync(directory, { recursive: true, force: true });
    });

    it("adopts an existing up-to-date database without losing JobPosts data", () => {
        const existing = new Database(databasePath);
        existing.exec(`
            CREATE TABLE "JobPosts" (
                "id" TEXT PRIMARY KEY NOT NULL,
                "sourceId" TEXT NOT NULL,
                "companyName" TEXT NOT NULL,
                "requisitionId" TEXT,
                "title" TEXT NOT NULL,
                "detailPath" TEXT NOT NULL,
                "jobLink" TEXT NOT NULL,
                "locations" TEXT NOT NULL DEFAULT '[]',
                "postedDate" TEXT,
                "importedDate" INTEGER NOT NULL,
                "detail" TEXT NOT NULL,
                "remoteType" TEXT
            );
            INSERT INTO "JobPosts" (
                "id", "sourceId", "companyName", "title", "detailPath", "jobLink", "importedDate", "detail"
            ) VALUES ('post-1', 'source-1', 'Acme', 'Engineer', '/jobs/1', 'https://example.com/jobs/1', 123, '{}');
        `);
        existing.close();

        provider = new SqliteDatabaseProvider(databasePath);

        expect(provider.client.prepare(`SELECT "importedDate" FROM "JobPosts" WHERE "id" = ?`).get("post-1")).toEqual({
            importedDate: 123,
        });
        expect(
            provider.client
                .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'job_applications'`)
                .get()
        ).toEqual({ name: "job_applications" });
    });

    it("does not reapply migrations when the database is reopened", () => {
        provider = new SqliteDatabaseProvider(databasePath);
        provider.close();
        provider = new SqliteDatabaseProvider(databasePath);

        expect(provider.client.prepare(`SELECT count(*) AS count FROM "__drizzle_migrations"`).get()).toEqual({
            count: 1,
        });
    });
});
