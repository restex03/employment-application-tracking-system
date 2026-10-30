using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class JobPostLocationsArray : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Location",
                table: "JobPosts",
                newName: "Locations");

            migrationBuilder.Sql("""
                ALTER TABLE "JobPosts"
                ALTER COLUMN "Locations" TYPE text[]
                USING CASE
                    WHEN "Locations" IS NULL OR btrim("Locations") = '' THEN ARRAY[]::text[]
                    ELSE ARRAY["Locations"]
                END;
                ALTER TABLE "JobPosts" ALTER COLUMN "Locations" SET NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "JobPosts" ALTER COLUMN "Locations" DROP NOT NULL;
                ALTER TABLE "JobPosts"
                ALTER COLUMN "Locations" TYPE text
                USING NULLIF(array_to_string("Locations", '; '), '');
                """);

            migrationBuilder.RenameColumn(
                name: "Locations",
                table: "JobPosts",
                newName: "Location");
        }
    }
}
