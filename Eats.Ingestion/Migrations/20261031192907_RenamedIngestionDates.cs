using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class RenamedIngestionDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "JobPosts",
                newName: "IngestionDate");

            migrationBuilder.RenameColumn(
                name: "FetchedAt",
                table: "JobPostDetails",
                newName: "IngestionDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IngestionDate",
                table: "JobPosts",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "IngestionDate",
                table: "JobPostDetails",
                newName: "FetchedAt");
        }
    }
}
