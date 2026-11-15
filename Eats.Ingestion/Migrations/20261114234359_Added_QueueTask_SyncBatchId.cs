using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Eats.Ingestion.Migrations
{
    /// <inheritdoc />
    public partial class Added_QueueTask_SyncBatchId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SyncBatchId",
                table: "QueueTasks",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_QueueTasks_SyncBatchId",
                table: "QueueTasks",
                column: "SyncBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QueueTasks_SyncBatchId",
                table: "QueueTasks");

            migrationBuilder.DropColumn(
                name: "SyncBatchId",
                table: "QueueTasks");
        }
    }
}
