using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class AddedJobLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "JobLink",
                table: "JobPosts",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "JobLink",
                table: "JobPosts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }
    }
}
