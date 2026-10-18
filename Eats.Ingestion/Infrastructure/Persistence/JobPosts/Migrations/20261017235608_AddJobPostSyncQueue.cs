using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts.Migrations
{
    /// <inheritdoc />
    public partial class AddJobPostSyncQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobPostSyncQueueJob",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceIds = table.Column<string[]>(type: "text[]", nullable: false),
                    SearchText = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Error = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPostSyncQueueJob", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobPostSyncQueueJob_Status_CreatedAt",
                table: "JobPostSyncQueueJob",
                columns: new[] { "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobPostSyncQueueJob");
        }
    }
}
