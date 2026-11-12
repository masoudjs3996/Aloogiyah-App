using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SellerCustomerDiscounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PlatformDiscountAmount",
                table: "SellerReceivables",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SellerDiscountAmount",
                table: "SellerReceivables",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "IssuerSellerId",
                table: "Discounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiscountFundingSource",
                table: "AgriculturalOrders",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformDiscountAmount",
                table: "AgriculturalOrders",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SellerDiscountAmount",
                table: "AgriculturalOrders",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Discounts_IssuerSellerId",
                table: "Discounts",
                column: "IssuerSellerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Discounts_Users_IssuerSellerId",
                table: "Discounts",
                column: "IssuerSellerId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Discounts_Users_IssuerSellerId",
                table: "Discounts");

            migrationBuilder.DropIndex(
                name: "IX_Discounts_IssuerSellerId",
                table: "Discounts");

            migrationBuilder.DropColumn(
                name: "PlatformDiscountAmount",
                table: "SellerReceivables");

            migrationBuilder.DropColumn(
                name: "SellerDiscountAmount",
                table: "SellerReceivables");

            migrationBuilder.DropColumn(
                name: "IssuerSellerId",
                table: "Discounts");

            migrationBuilder.DropColumn(
                name: "DiscountFundingSource",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "PlatformDiscountAmount",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "SellerDiscountAmount",
                table: "AgriculturalOrders");
        }
    }
}
