using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitFarmOrdersAndCheckout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressSnapshotJson",
                table: "AgriculturalOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CheckoutId",
                table: "AgriculturalOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeliveredAt",
                table: "AgriculturalOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveredById",
                table: "AgriculturalOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "AgriculturalOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FarmNameSnapshot",
                table: "AgriculturalOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "InventoryReserved",
                table: "AgriculturalOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "AgriculturalOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ShippedAt",
                table: "AgriculturalOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingAmount",
                table: "AgriculturalOrders",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ShippingMethod",
                table: "AgriculturalOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "AgriculturalOrders",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TrackingCode",
                table: "AgriculturalOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "AgriculturalOrders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ProductCodeSnapshot",
                table: "AgriculturalOrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductNameSnapshot",
                table: "AgriculturalOrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductSlugSnapshot",
                table: "AgriculturalOrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AgriculturalOrderHistories",
                columns: table => new
                {
                    AgriculturalOrderHistoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgriculturalOrderId = table.Column<int>(type: "integer", nullable: false),
                    ActorId = table.Column<int>(type: "integer", nullable: true),
                    Action = table.Column<string>(type: "text", nullable: false),
                    FromStatusCode = table.Column<string>(type: "text", nullable: false),
                    ToStatusCode = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalOrderHistories", x => x.AgriculturalOrderHistoryId);
                    table.ForeignKey(
                        name: "FK_AgriculturalOrderHistories_AgriculturalOrders_AgriculturalO~",
                        column: x => x.AgriculturalOrderId,
                        principalTable: "AgriculturalOrders",
                        principalColumn: "AgriculturalOrderId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Checkouts",
                columns: table => new
                {
                    CheckoutId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BuyerId = table.Column<int>(type: "integer", nullable: false),
                    CartId = table.Column<Guid>(type: "uuid", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequestHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CartSnapshotJson = table.Column<string>(type: "text", nullable: false),
                    PayableAmount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    IsExpired = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    DiscountId = table.Column<int>(type: "integer", nullable: true),
                    DiscountReserved = table.Column<bool>(type: "boolean", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Checkouts", x => x.CheckoutId);
                    table.ForeignKey(
                        name: "FK_Checkouts_Discounts_DiscountId",
                        column: x => x.DiscountId,
                        principalTable: "Discounts",
                        principalColumn: "DiscountId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Checkouts_Users_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrderRefunds",
                columns: table => new
                {
                    OrderRefundId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgriculturalOrderId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedById = table.Column<int>(type: "integer", nullable: true),
                    Reference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderRefunds", x => x.OrderRefundId);
                    table.ForeignKey(
                        name: "FK_OrderRefunds_AgriculturalOrders_AgriculturalOrderId",
                        column: x => x.AgriculturalOrderId,
                        principalTable: "AgriculturalOrders",
                        principalColumn: "AgriculturalOrderId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    TransactionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WalletId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    TransactionType = table.Column<int>(type: "integer", nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransactions", x => x.TransactionId);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Wallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
                        principalColumn: "WalletId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutPayments",
                columns: table => new
                {
                    CheckoutPaymentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CheckoutId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    Method = table.Column<string>(type: "text", nullable: false),
                    Reference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ConfirmedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutPayments", x => x.CheckoutPaymentId);
                    table.ForeignKey(
                        name: "FK_CheckoutPayments_Checkouts_CheckoutId",
                        column: x => x.CheckoutId,
                        principalTable: "Checkouts",
                        principalColumn: "CheckoutId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_CheckoutId_FarmId",
                table: "AgriculturalOrders",
                columns: new[] { "CheckoutId", "FarmId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_FarmId",
                table: "AgriculturalOrders",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrderHistories_AgriculturalOrderId",
                table: "AgriculturalOrderHistories",
                column: "AgriculturalOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrderHistories_Code_IsDeleted",
                table: "AgriculturalOrderHistories",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutPayments_CheckoutId",
                table: "CheckoutPayments",
                column: "CheckoutId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutPayments_Code_IsDeleted",
                table: "CheckoutPayments",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutPayments_Reference",
                table: "CheckoutPayments",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_BuyerId_IdempotencyKey",
                table: "Checkouts",
                columns: new[] { "BuyerId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_CartId_IsPaid_IsExpired",
                table: "Checkouts",
                columns: new[] { "CartId", "IsPaid", "IsExpired" });

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_Code_IsDeleted",
                table: "Checkouts",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_DiscountId",
                table: "Checkouts",
                column: "DiscountId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderRefunds_AgriculturalOrderId",
                table: "OrderRefunds",
                column: "AgriculturalOrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderRefunds_Code_IsDeleted",
                table: "OrderRefunds",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderRefunds_Reference",
                table: "OrderRefunds",
                column: "Reference",
                unique: true,
                filter: "\"Reference\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_Code_IsDeleted",
                table: "WalletTransactions",
                columns: new[] { "Code", "IsDeleted" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WalletId",
                table: "WalletTransactions",
                column: "WalletId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalOrders_Checkouts_CheckoutId",
                table: "AgriculturalOrders",
                column: "CheckoutId",
                principalTable: "Checkouts",
                principalColumn: "CheckoutId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalOrders_Farms_FarmId",
                table: "AgriculturalOrders",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalOrders_Checkouts_CheckoutId",
                table: "AgriculturalOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalOrders_Farms_FarmId",
                table: "AgriculturalOrders");

            migrationBuilder.DropTable(
                name: "AgriculturalOrderHistories");

            migrationBuilder.DropTable(
                name: "CheckoutPayments");

            migrationBuilder.DropTable(
                name: "OrderRefunds");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "Checkouts");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_CheckoutId_FarmId",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_FarmId",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "AddressSnapshotJson",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "CheckoutId",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "DeliveredById",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "FarmNameSnapshot",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "InventoryReserved",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "ShippedAt",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "ShippingAmount",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "ShippingMethod",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "Subtotal",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "TrackingCode",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "ProductCodeSnapshot",
                table: "AgriculturalOrderItems");

            migrationBuilder.DropColumn(
                name: "ProductNameSnapshot",
                table: "AgriculturalOrderItems");

            migrationBuilder.DropColumn(
                name: "ProductSlugSnapshot",
                table: "AgriculturalOrderItems");
        }
    }
}
