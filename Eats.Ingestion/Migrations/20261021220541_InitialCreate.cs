using System;
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
            migrationBuilder.CreateTable(
                name: "JobSources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    BaseUrl = table.Column<string>(type: "text", nullable: false),
                    BrowserBaseUrl = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobSources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QueueTasks",
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
                    table.PrimaryKey("PK_QueueTasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobPosts",
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
                    table.PrimaryKey("PK_JobPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPosts_JobSources_SourceId",
                        column: x => x.SourceId,
                        principalTable: "JobSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "JobPostDetails",
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
                    table.PrimaryKey("PK_JobPostDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPostDetails_JobPosts_JobPostId",
                        column: x => x.JobPostId,
                        principalTable: "JobPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobPostDetails_JobPostId",
                table: "JobPostDetails",
                column: "JobPostId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_JobPosts_SourceId_DetailPath",
                table: "JobPosts",
                columns: new[] { "SourceId", "DetailPath" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobSources_BaseUrl",
                table: "JobSources",
                column: "BaseUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobSources_BrowserBaseUrl",
                table: "JobSources",
                column: "BrowserBaseUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobSources_CompanyName",
                table: "JobSources",
                column: "CompanyName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QueueTasks_Status_CreatedAt",
                table: "QueueTasks",
                columns: new[] { "Status", "CreatedAt" });
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
