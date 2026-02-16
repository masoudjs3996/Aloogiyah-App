using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IndexForCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code_IsDeleted",
                table: "Warehouses",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseInventories_Code_IsDeleted",
                table: "WarehouseInventories",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_Code_IsDeleted",
                table: "Wallets",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Villages_Code_IsDeleted",
                table: "Villages",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Code_IsDeleted",
                table: "Users",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Statuses_Code_IsDeleted",
                table: "Statuses",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StatusChangeLogs_Code_IsDeleted",
                table: "StatusChangeLogs",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_Code_IsDeleted",
                table: "ServiceRequests",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Code_IsDeleted",
                table: "Roles",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_Code_IsDeleted",
                table: "RefreshToken",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QualityAssessments_Code_IsDeleted",
                table: "QualityAssessments",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Provinces_Code_IsDeleted",
                table: "Provinces",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Code_IsDeleted",
                table: "Products",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Code_IsDeleted",
                table: "Orders",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_Code_IsDeleted",
                table: "OrderItems",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Code_IsDeleted",
                table: "Notifications",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileTypes_Code_IsDeleted",
                table: "FileTypes",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Files_Code_IsDeleted",
                table: "Files",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Farms_Code_IsDeleted",
                table: "Farms",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Discounts_Code_IsDeleted",
                table: "Discounts",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Countys_Code_IsDeleted",
                table: "Countys",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_Code_IsDeleted",
                table: "Comments",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Citys_Code_IsDeleted",
                table: "Citys",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_Code_IsDeleted",
                table: "ChatMessages",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Code_IsDeleted",
                table: "Categories",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Carts_Code_IsDeleted",
                table: "Carts",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_Code_IsDeleted",
                table: "CartItems",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Auctions_Code_IsDeleted",
                table: "Auctions",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuctionBids_Code_IsDeleted",
                table: "AuctionBids",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Code_IsDeleted",
                table: "Articles",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProducts_Code_IsDeleted",
                table: "AgriculturalProducts",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_Code_IsDeleted",
                table: "AgriculturalOrders",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrderItems_Code_IsDeleted",
                table: "AgriculturalOrderItems",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_Code_IsDeleted",
                table: "Addresses",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Warehouses_Code_IsDeleted",
                table: "Warehouses");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseInventories_Code_IsDeleted",
                table: "WarehouseInventories");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_Code_IsDeleted",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_Villages_Code_IsDeleted",
                table: "Villages");

            migrationBuilder.DropIndex(
                name: "IX_Users_Code_IsDeleted",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Statuses_Code_IsDeleted",
                table: "Statuses");

            migrationBuilder.DropIndex(
                name: "IX_StatusChangeLogs_Code_IsDeleted",
                table: "StatusChangeLogs");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_Code_IsDeleted",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_Roles_Code_IsDeleted",
                table: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_RefreshToken_Code_IsDeleted",
                table: "RefreshToken");

            migrationBuilder.DropIndex(
                name: "IX_QualityAssessments_Code_IsDeleted",
                table: "QualityAssessments");

            migrationBuilder.DropIndex(
                name: "IX_Provinces_Code_IsDeleted",
                table: "Provinces");

            migrationBuilder.DropIndex(
                name: "IX_Products_Code_IsDeleted",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Code_IsDeleted",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_Code_IsDeleted",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_Code_IsDeleted",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_FileTypes_Code_IsDeleted",
                table: "FileTypes");

            migrationBuilder.DropIndex(
                name: "IX_Files_Code_IsDeleted",
                table: "Files");

            migrationBuilder.DropIndex(
                name: "IX_Farms_Code_IsDeleted",
                table: "Farms");

            migrationBuilder.DropIndex(
                name: "IX_Discounts_Code_IsDeleted",
                table: "Discounts");

            migrationBuilder.DropIndex(
                name: "IX_Countys_Code_IsDeleted",
                table: "Countys");

            migrationBuilder.DropIndex(
                name: "IX_Comments_Code_IsDeleted",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Citys_Code_IsDeleted",
                table: "Citys");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_Code_IsDeleted",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_Categories_Code_IsDeleted",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Carts_Code_IsDeleted",
                table: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_Code_IsDeleted",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_Auctions_Code_IsDeleted",
                table: "Auctions");

            migrationBuilder.DropIndex(
                name: "IX_AuctionBids_Code_IsDeleted",
                table: "AuctionBids");

            migrationBuilder.DropIndex(
                name: "IX_Articles_Code_IsDeleted",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalProducts_Code_IsDeleted",
                table: "AgriculturalProducts");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_Code_IsDeleted",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrderItems_Code_IsDeleted",
                table: "AgriculturalOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_Addresses_Code_IsDeleted",
                table: "Addresses");
        }
    }
}
