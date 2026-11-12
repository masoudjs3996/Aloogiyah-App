using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AccountDeletionAndChatModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountFileDeletions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Storage = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Key = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    RetryAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountFileDeletions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessageReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<int>(type: "integer", nullable: false),
                    ReporterId = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    MessageText = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReviewedById = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessageReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessageReports_ChatMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "ChatMessageId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatMessageReports_Users_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatMessageReports_Users_ReviewedById",
                        column: x => x.ReviewedById,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountFileDeletions_RetryAt",
                table: "AccountFileDeletions",
                column: "RetryAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessageReports_MessageId",
                table: "ChatMessageReports",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessageReports_ReporterId_MessageId",
                table: "ChatMessageReports",
                columns: new[] { "ReporterId", "MessageId" },
                unique: true,
                filter: "\"ReviewedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessageReports_ReviewedById",
                table: "ChatMessageReports",
                column: "ReviewedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountFileDeletions");

            migrationBuilder.DropTable(
                name: "ChatMessageReports");
        }
    }
}
