using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GroupedDeliveryCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ReleasedAmount",
                table: "SellerReceivables",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("UPDATE \"SellerReceivables\" SET \"ReleasedAmount\" = \"NetAmount\" WHERE \"ReleasedAt\" IS NOT NULL;");

            migrationBuilder.AddColumn<bool>(
                name: "CompanyDelivery",
                table: "AgriculturalOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DeliveredQuantity",
                table: "AgriculturalOrderItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryVersion",
                table: "AgriculturalOrderItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "ReceivedAtHubQuantity",
                table: "AgriculturalOrderItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
UPDATE "AgriculturalOrderItems" i SET "DeliveredQuantity" = i."Quantity", "ReceivedAtHubQuantity" = i."Quantity"
FROM "AgriculturalOrders" o JOIN "Statuses" s ON s."StatusId" = o."StatusId"
WHERE i."AgriculturalOrderId" = o."AgriculturalOrderId" AND s."Code" = '70972F464D';
""");

            // No account is granted this role automatically. Management assigns representatives explicitly.
            migrationBuilder.Sql("""
INSERT INTO "Roles" ("RoleId", "Name", "Description", "Code", "CreatedAt", "IsDeleted")
SELECT (SELECT COALESCE(MAX("RoleId"), 0) + 1 FROM "Roles"), 'DeliveryAgent', 'Company delivery representative',
       upper(substr(md5(random()::text), 1, 10)), now(), false
WHERE NOT EXISTS (SELECT 1 FROM "Roles" WHERE "Name" = 'DeliveryAgent');
""");

            migrationBuilder.CreateTable(
                name: "DeliveryPoints",
                columns: table => new
                {
                    DeliveryPointId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Address = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Hours = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CollectionTerms = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DirectFee = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: true),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryPoints", x => x.DeliveryPointId);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryBookings",
                columns: table => new
                {
                    DeliveryBookingId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BuyerId = table.Column<int>(type: "integer", nullable: false),
                    CartId = table.Column<Guid>(type: "uuid", nullable: false),
                    CartHash = table.Column<string>(type: "text", nullable: false),
                    AddressCode = table.Column<string>(type: "text", nullable: false),
                    AddressSnapshot = table.Column<string>(type: "text", nullable: false),
                    DeliveryPointId = table.Column<int>(type: "integer", nullable: false),
                    PointSnapshot = table.Column<string>(type: "text", nullable: false),
                    Method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Window = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Fee = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: true),
                    QuoteExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    QuotedById = table.Column<int>(type: "integer", nullable: true),
                    CheckoutId = table.Column<int>(type: "integer", nullable: true),
                    RequestedMethod = table.Column<string>(type: "text", nullable: true),
                    ChangeReason = table.Column<string>(type: "text", nullable: true),
                    ChangeFee = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryBookings", x => x.DeliveryBookingId);
                    table.ForeignKey(
                        name: "FK_DeliveryBookings_Checkouts_CheckoutId",
                        column: x => x.CheckoutId,
                        principalTable: "Checkouts",
                        principalColumn: "CheckoutId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryBookings_DeliveryPoints_DeliveryPointId",
                        column: x => x.DeliveryPointId,
                        principalTable: "DeliveryPoints",
                        principalColumn: "DeliveryPointId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryBookings_Users_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryBatches",
                columns: table => new
                {
                    DeliveryBatchId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeliveryBookingId = table.Column<int>(type: "integer", nullable: false),
                    AgentId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExpectedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CodeExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CodeIssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedById = table.Column<int>(type: "integer", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryBatches", x => x.DeliveryBatchId);
                    table.ForeignKey(
                        name: "FK_DeliveryBatches_DeliveryBookings_DeliveryBookingId",
                        column: x => x.DeliveryBookingId,
                        principalTable: "DeliveryBookings",
                        principalColumn: "DeliveryBookingId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryBatches_Users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryEvents",
                columns: table => new
                {
                    DeliveryEventId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeliveryBookingId = table.Column<int>(type: "integer", nullable: false),
                    ActorId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryEvents", x => x.DeliveryEventId);
                    table.ForeignKey(
                        name: "FK_DeliveryEvents_DeliveryBookings_DeliveryBookingId",
                        column: x => x.DeliveryBookingId,
                        principalTable: "DeliveryBookings",
                        principalColumn: "DeliveryBookingId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryBatchItems",
                columns: table => new
                {
                    DeliveryBatchItemId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeliveryBatchId = table.Column<int>(type: "integer", nullable: false),
                    AgriculturalOrderItemId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryBatchItems", x => x.DeliveryBatchItemId);
                    table.ForeignKey(
                        name: "FK_DeliveryBatchItems_AgriculturalOrderItems_AgriculturalOrder~",
                        column: x => x.AgriculturalOrderItemId,
                        principalTable: "AgriculturalOrderItems",
                        principalColumn: "AgriculturalOrderItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryBatchItems_DeliveryBatches_DeliveryBatchId",
                        column: x => x.DeliveryBatchId,
                        principalTable: "DeliveryBatches",
                        principalColumn: "DeliveryBatchId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_AgentId",
                table: "DeliveryBatches",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_Code",
                table: "DeliveryBatches",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_DeliveryBookingId",
                table: "DeliveryBatches",
                column: "DeliveryBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatchItems_AgriculturalOrderItemId",
                table: "DeliveryBatchItems",
                column: "AgriculturalOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatchItems_Code",
                table: "DeliveryBatchItems",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatchItems_DeliveryBatchId_AgriculturalOrderItemId",
                table: "DeliveryBatchItems",
                columns: new[] { "DeliveryBatchId", "AgriculturalOrderItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBookings_BuyerId_CreatedAt",
                table: "DeliveryBookings",
                columns: new[] { "BuyerId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBookings_CheckoutId",
                table: "DeliveryBookings",
                column: "CheckoutId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBookings_Code",
                table: "DeliveryBookings",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBookings_DeliveryPointId",
                table: "DeliveryBookings",
                column: "DeliveryPointId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryEvents_Code",
                table: "DeliveryEvents",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryEvents_DeliveryBookingId",
                table: "DeliveryEvents",
                column: "DeliveryBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryPoints_Code",
                table: "DeliveryPoints",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryBatchItems");

            migrationBuilder.DropTable(
                name: "DeliveryEvents");

            migrationBuilder.DropTable(
                name: "DeliveryBatches");

            migrationBuilder.DropTable(
                name: "DeliveryBookings");

            migrationBuilder.DropTable(
                name: "DeliveryPoints");

            migrationBuilder.DropColumn(
                name: "ReleasedAmount",
                table: "SellerReceivables");

            migrationBuilder.DropColumn(
                name: "CompanyDelivery",
                table: "AgriculturalOrders");

            migrationBuilder.DropColumn(
                name: "DeliveredQuantity",
                table: "AgriculturalOrderItems");

            migrationBuilder.DropColumn(
                name: "DeliveryVersion",
                table: "AgriculturalOrderItems");

            migrationBuilder.DropColumn(
                name: "ReceivedAtHubQuantity",
                table: "AgriculturalOrderItems");
        }
    }
}
