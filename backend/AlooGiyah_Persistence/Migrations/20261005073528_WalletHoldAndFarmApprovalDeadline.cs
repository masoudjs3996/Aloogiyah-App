using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class WalletHoldAndFarmApprovalDeadline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Checkouts_CartId_IsPaid_IsExpired",
                table: "Checkouts");

            migrationBuilder.AddColumn<bool>(
                name: "IsSubmitted",
                table: "Checkouts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Existing successful payments are submissions; never retroactively reserve their funds.
            migrationBuilder.Sql("UPDATE \"Checkouts\" SET \"IsSubmitted\" = TRUE WHERE \"IsPaid\" = TRUE;");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ApprovalExpiresAt",
                table: "AgriculturalOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_CartId_IsSubmitted_IsPaid_IsExpired",
                table: "Checkouts",
                columns: new[] { "CartId", "IsSubmitted", "IsPaid", "IsExpired" });

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_IsHeld_ApprovalExpiresAt",
                table: "AgriculturalOrders",
                columns: new[] { "IsHeld", "ApprovalExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Checkouts_CartId_IsSubmitted_IsPaid_IsExpired",
                table: "Checkouts");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_IsHeld_ApprovalExpiresAt",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "IsSubmitted",
                table: "Checkouts");

            migrationBuilder.DropColumn(
                name: "ApprovalExpiresAt",
                table: "AgriculturalOrders");

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_CartId_IsPaid_IsExpired",
                table: "Checkouts",
                columns: new[] { "CartId", "IsPaid", "IsExpired" });
        }
    }
}
