using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class Added_QueueTask_CompletedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "QueueTasks",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "QueueTasks");
        }
    }
}
