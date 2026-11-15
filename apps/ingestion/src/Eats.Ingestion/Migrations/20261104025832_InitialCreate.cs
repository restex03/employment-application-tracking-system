using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing tables are preserved, not reconciled with this schema.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "JobSources" (
                    "Id" uuid NOT NULL,
                    "CompanyName" text NOT NULL,
                    "BaseUrl" text NOT NULL,
                    "BrowserBaseUrl" text NOT NULL,
                    CONSTRAINT "PK_JobSources" PRIMARY KEY ("Id")
                );

                CREATE TABLE IF NOT EXISTS "QueueTasks" (
                    "Id" uuid NOT NULL,
                    "SourceId" uuid NOT NULL,
                    "SearchText" text,
                    "Status" integer NOT NULL,
                    "Error" text,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "CompletedAt" timestamp with time zone,
                    CONSTRAINT "PK_QueueTasks" PRIMARY KEY ("Id")
                );

                CREATE TABLE IF NOT EXISTS "JobPosts" (
                    "Id" uuid NOT NULL,
                    "SourceId" uuid NOT NULL,
                    "RequisitionId" text,
                    "Title" text NOT NULL,
                    "DetailPath" text NOT NULL,
                    "Locations" text[] NOT NULL,
                    "IngestionDate" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "RemoteType" text,
                    "JobLink" TEXT NOT NULL,
                    "PostedDate" timestamp with time zone,
                    "ExcludeFromPublication" boolean NOT NULL,
                    "ReadyForPublication" boolean NOT NULL,
                    CONSTRAINT "PK_JobPosts" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_JobPosts_JobSources_SourceId"
                        FOREIGN KEY ("SourceId") REFERENCES "JobSources" ("Id") ON DELETE RESTRICT
                );

                CREATE TABLE IF NOT EXISTS "JobPostDetails" (
                    "Id" uuid NOT NULL,
                    "JobPostId" uuid NOT NULL,
                    "Description" text NOT NULL,
                    "EmploymentType" text,
                    "Locations" text,
                    "ValidThrough" text,
                    "RemoteType" text,
                    "ApplicantLocations" text,
                    "IngestionDate" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "PK_JobPostDetails" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_JobPostDetails_JobPosts_JobPostId"
                        FOREIGN KEY ("JobPostId") REFERENCES "JobPosts" ("Id") ON DELETE CASCADE
                );

                CREATE UNIQUE INDEX IF NOT EXISTS "IX_JobPostDetails_JobPostId"
                    ON "JobPostDetails" ("JobPostId");
                CREATE UNIQUE INDEX IF NOT EXISTS "UX_JobPosts_SourceId_DetailPath"
                    ON "JobPosts" ("SourceId", "DetailPath");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_JobSources_BaseUrl"
                    ON "JobSources" ("BaseUrl");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_JobSources_BrowserBaseUrl"
                    ON "JobSources" ("BrowserBaseUrl");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_JobSources_CompanyName"
                    ON "JobSources" ("CompanyName");
                CREATE INDEX IF NOT EXISTS "IX_QueueTasks_Status_CreatedAt"
                    ON "QueueTasks" ("Status", "CreatedAt");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobPostDetails");

            migrationBuilder.DropTable(
                name: "QueueTasks");

            migrationBuilder.DropTable(
                name: "JobPosts");

            migrationBuilder.DropTable(
                name: "JobSources");
        }
    }
}
