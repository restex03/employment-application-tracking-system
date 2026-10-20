using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobPostSyncQueueJob",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceIds = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    SearchText = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Error = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPostSyncQueueJob", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobSource",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    BaseUrl = table.Column<string>(type: "text", nullable: false),
                    BrowserBaseUrl = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobSource", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobPost",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequisitionId = table.Column<string>(type: "text", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    DetailPath = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    DaysOld = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    RemoteType = table.Column<string>(type: "text", nullable: true),
                    Dismissed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPost", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPost_JobSource_SourceId",
                        column: x => x.SourceId,
                        principalTable: "JobSource",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "JobPostDetail",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JobPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    EmploymentType = table.Column<string>(type: "text", nullable: true),
                    Locations = table.Column<string>(type: "text", nullable: true),
                    ValidThrough = table.Column<string>(type: "text", nullable: true),
                    RemoteType = table.Column<string>(type: "text", nullable: true),
                    ApplicantLocations = table.Column<string>(type: "text", nullable: true),
                    FetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPostDetail", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPostDetail_JobPost_JobPostId",
                        column: x => x.JobPostId,
                        principalTable: "JobPost",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UX_JobPost_SourceId_DetailPath",
                table: "JobPost",
                columns: new[] { "SourceId", "DetailPath" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobPostDetail_JobPostId",
                table: "JobPostDetail",
                column: "JobPostId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobPostSyncQueueJob_Status_CreatedAt",
                table: "JobPostSyncQueueJob",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_JobSource_BaseUrl",
                table: "JobSource",
                column: "BaseUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobSource_BrowserBaseUrl",
                table: "JobSource",
                column: "BrowserBaseUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobSource_CompanyName",
                table: "JobSource",
                column: "CompanyName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobPostDetail");

            migrationBuilder.DropTable(
                name: "JobPostSyncQueueJob");

            migrationBuilder.DropTable(
                name: "JobPost");

            migrationBuilder.DropTable(
                name: "JobSource");
        }
    }
}
