using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class Added_JobPost_PublishedDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReadyForPublication",
                table: "JobPosts");

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedDate",
                table: "JobPosts",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublishedDate",
                table: "JobPosts");

            migrationBuilder.AddColumn<bool>(
                name: "ReadyForPublication",
                table: "JobPosts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
