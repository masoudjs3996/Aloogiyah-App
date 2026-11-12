using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChatFileUploadIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UploadRequestId",
                table: "ChatMessages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId_UploadRequestId",
                table: "ChatMessages",
                columns: new[] { "SenderId", "UploadRequestId" },
                unique: true,
                filter: "\"UploadRequestId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_SenderId_UploadRequestId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "UploadRequestId",
                table: "ChatMessages");

        }
    }
}
